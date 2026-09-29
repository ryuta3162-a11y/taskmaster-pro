/**
 * ADMIN「分析」タブ用データ。期間の絞り込みはフロントで行うため、依頼・対象単位の明細をコンパクトに返す。
 * units: [taskIdx, personIdx(-1=なし), storeName, done(0/1), onTime(0/1), hoursToDone(null可)]
 *  - 社員・TF依頼: personIdx=対象者
 *  - 店舗依頼: storeName=対象店舗、personIdx=完了操作した人（未完了は -1）
 */
function buildAdminAnalytics_(requestRows, employees, allStores, now) {
  var areasList = getAreasListFromStores_(allStores);
  var people = [];
  var personIdx = {};
  var empByEmail = getEmployeesByEmailMap_(employees);
  var empByName = {};
  employees.forEach(function (e) {
    var key = String(e.name || '').replace(/[\s\u3000]+/g, '');
    if (key && !empByName[key]) empByName[key] = e;
  });
  function pIdx(email) {
    var em = normalizeTaskEmail(email);
    if (!em) return -1;
    if (personIdx[em] == null) {
      var emp = empByEmail[em];
      personIdx[em] = people.length;
      people.push({
        e: em,
        n: emp ? emp.name : em.split('@')[0],
        r: emp ? emp.role : '',
        t: emp ? emp.team : '',
        a: emp ? emp.area : '',
        reg: emp ? 1 : 0
      });
    }
    return personIdx[em];
  }
  employees.forEach(function (e) { pIdx(e.email); });

  var tasks = [];
  var units = [];
  requestRows.forEach(function (row) {
    var id = String(row[0] || '').trim();
    if (!id) return;
    var created = toDateOrNull_(row[1]);
    if (!created) return;
    var deadline = toDateOrNull_(row[3]);
    var deadlineEnd = deadline ? new Date(dayStart_(deadline).getTime() + 24 * 60 * 60 * 1000 - 1) : null;
    var kind = getRequestKindFromRow_(row);
    var payload = parseCompletionPayload_(String(row[14] || '[]'));
    var senderName = String(row[4] || '').trim();
    var senderEmp = empByName[senderName.replace(/[\s\u3000]+/g, '')];
    var ti = tasks.length;
    tasks.push({
      id: id,
      c: created.getTime(),
      d: deadline ? Utilities.formatDate(deadline, 'JST', 'yyyy-MM-dd') : '',
      k: kind,
      ty: String(row[2] || '').trim() || '新規投稿',
      s: senderName || '不明',
      sp: senderEmp ? pIdx(senderEmp.email) : -1,
      tg: String(row[12] || '').substring(0, 80),
      ct: String(row[5] || '').replace(/\s+/g, ' ').trim().substring(0, 60)
    });

    function pushUnit(pi, storeName, doneAt, isDone) {
      var onTime = isDone && (!deadlineEnd || (doneAt && doneAt.getTime() <= deadlineEnd.getTime())) ? 1 : 0;
      var hours = isDone && doneAt ? Math.max(0, Math.round((doneAt.getTime() - created.getTime()) / 36e5 * 10) / 10) : null;
      units.push([ti, pi, storeName || '', isDone ? 1 : 0, onTime, hours]);
    }

    if (kind === 'store') {
      var sc = payload.stores || {};
      getTaskStoresForRow_(row, allStores, areasList).forEach(function (sn) {
        var rec = sc[sn];
        if (rec) {
          pushUnit(pIdx(rec.by), sn, parseLooseCompletionDate_(rec.at || '', created), true);
        } else {
          pushUnit(-1, sn, null, false);
        }
      });
    } else {
      var doneMap = {};
      (payload.people || []).forEach(function (d) {
        doneMap[normalizeTaskEmail(d.email)] = parseLooseCompletionDate_(d.time || d.at || '', created) || 'done';
      });
      parseTargetEmails(String(row[13] || '')).forEach(function (em) {
        var at = doneMap[em];
        pushUnit(pIdx(em), '', at instanceof Date ? at : null, !!at);
      });
    }
  });

  var storeMeta = {};
  getFieldStores_(allStores).forEach(function (s) { storeMeta[s.storeName] = [s.area, s.territory]; });

  return {
    ok: true,
    generatedAt: now.toISOString(),
    people: people,
    tasks: tasks,
    units: units,
    storeMeta: storeMeta,
    excludeRoles: getAdminIncompleteExcludeRoles_()
  };
}

function getAdminAnalyticsData() {
  try {
    var email = Session.getActiveUser().getEmail();
    if (!email || !isAdminUser_(email)) {
      return { ok: false, message: 'このデータを閲覧する権限がありません。' };
    }
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('申請データ');
    if (!sheet) return { ok: true, people: [], tasks: [], units: [], storeMeta: {}, excludeRoles: [] };
    var values = sheet.getDataRange().getValues();
    values.shift();
    return buildAdminAnalytics_(values, getEmployees(), getStoreData(), new Date());
  } catch (e) {
    return { ok: false, message: String(e && e.message ? e.message : e) };
  }
}
