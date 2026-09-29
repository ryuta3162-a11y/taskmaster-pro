"""26年度EAST10/1 の通知先から、従業員ごとの新管轄店舗（H列〜）とエリア(E)/テリトリー(F)を生成し、
GAS 用 NewOrgMigration.js を書き出す。"""
import os, re, json, unicodedata, urllib.request, openpyxl

SS = '1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc'
AREAS = ['第1エリア', '第2エリア', '第3エリア', '第4エリア', '第5エリア', '第6エリア', '第7エリア']
p = os.path.join(os.environ['TEMP'], 'todo_mig.xlsx')
urllib.request.urlretrieve('https://docs.google.com/spreadsheets/d/%s/export?format=xlsx' % SS, p)
wb = openpyxl.load_workbook(p)
g = lambda pre: [w for w in wb.worksheets if w.title.startswith(pre)][0]
def n(s): return re.sub(r'\s+', '', unicodedata.normalize('NFKC', str(s or ''))).lower()
def s_(v): return '' if v is None else str(v).strip()

new_st = [(s_(r[0]), s_(r[1]), s_(r[2])) for r in g('新店舗データ').iter_rows(min_row=2, values_only=True) if s_(r[2])]
order = {s[2]: i for i, s in enumerate(new_st)}
meta = {s[2]: s for s in new_st}
new_norm = {n(s[2]): s[2] for s in new_st}
alias = {n('分倍河原'): 'MINANO分倍河原', n('J+麻布十番'): 'JOYFIT＋麻布十番', n('川崎砂子2丁目'): '川崎砂子二丁目',
         n('FIT365柏松ヶ崎'): 'FIT365イオン松ヶ崎', n('FIT365コープ葛飾白鳥'): 'FIT365葛飾白鳥',
         n('FIT365Qiz MALL龍ヶ崎'): 'FIT365龍ヶ崎', n('FIT365稲城'): 'FIT365稲城SANWA'}

mapping = {}
for r in g('26').iter_rows(min_row=3):
    st = s_(r[1].value)
    if not st or s_(r[0].value):
        continue
    key = alias.get(n(st)) or new_norm.get(n(st))
    if not key:
        raise SystemExit('店舗名が新店舗データに無い: ' + st)
    for c in r[3:]:
        e = s_(c.value).rstrip('/').strip().lower()
        if '@' in e:
            mapping.setdefault(e, [])
            if key not in mapping[e]:
                mapping[e].append(key)

emp_emails = set()
out = {}
for r in g('従業員データ').iter_rows(min_row=2, values_only=True):
    e = s_(r[1]).lower()
    if not e:
        continue
    emp_emails.add(e)
    if e not in mapping:
        continue
    stores = sorted(mapping[e], key=lambda x: order[x])
    areas = [a for a in AREAS if any(meta[x][0] == a for x in stores)]
    terr = []
    for a in areas:
        ts = []
        for x in stores:
            if meta[x][0] == a and meta[x][1] not in ts:
                ts.append(meta[x][1])
        ts.sort()
        terr.append('%s: %s' % (a, ','.join(ts)))
    out[e] = {'stores': stores, 'area': ', '.join(areas), 'territory': ' / '.join(terr)}

js = ('/** 新組織（26年度EAST10/1）移行用データ。新組織_移行データ生成.py で生成。 */\n'
      'var NEW_ORG_EMPLOYEE_STORES_ = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'NewOrgMigrationData.gs')
open(dst, 'w', encoding='utf-8').write(js)
print('employees mapped:', len(out), 'not registered:', sorted(e for e in mapping if e not in emp_emails))
