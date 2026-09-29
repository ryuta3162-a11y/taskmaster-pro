import os, re, unicodedata, urllib.request, openpyxl, csv, io, urllib.parse
from collections import Counter, defaultdict
SS = '1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc'
p = os.path.join(os.environ['TEMP'], 'todo2.xlsx')
urllib.request.urlretrieve('https://docs.google.com/spreadsheets/d/%s/export?format=xlsx' % SS, p)
wb = openpyxl.load_workbook(p)
g = lambda pre: [w for w in wb.worksheets if w.title.startswith(pre)][0]
def n(s): return re.sub(r'\s+', '', unicodedata.normalize('NFKC', str(s or ''))).lower()
def raw(v): return '' if v is None else str(v)
EMAIL_RE = re.compile(r'^[a-z0-9._+-]+@okamoto-group\.co\.jp$')
out = []
def P(*a): out.append(' '.join(str(x) for x in a))

old = [(raw(r[0]).strip(), raw(r[1]).strip(), raw(r[2]).strip(), raw(r[3])) for r in g('店舗データ').iter_rows(min_row=2, values_only=True) if any(r[:4])]
new = [(raw(r[0]), raw(r[1]), raw(r[2]), raw(r[3])) for r in g('新店舗データ').iter_rows(min_row=2, values_only=True) if any(r[:4])]
old_by = {o[2]: o for o in old}

P('# 1. 新店舗データ（新組織） 単体チェック  行数=%d' % len(new))
names = [x[2].strip() for x in new]
for k, c in Counter(names).items():
    if c > 1: P('- 店舗名の重複:', k, c, '回')
for k, c in Counter(x[3].strip().lower() for x in new if x[3].strip()).items():
    if c > 1: P('- 店舗メールの重複:', k, [x[2] for x in new if x[3].strip().lower() == k])
for i, (a, t, s, m) in enumerate(new, start=2):
    tag = '%d行目 %s/%s/%s' % (i, a, t, s)
    for col, v in (('A', a), ('B', t), ('C', s), ('D', m)):
        if v != v.strip(): P('- 前後に空白:', tag, col, repr(v))
        if '\n' in v: P('- 改行あり:', tag, col)
    if '本部' in a: continue
    if not re.match(r'^第[1-7]エリア$', a.strip()): P('- エリア名が不正:', tag)
    if not re.match(r'^テリトリー[1-9]$', t.strip()): P('- テリトリー名が不正:', tag)
    if not m.strip(): P('- 店舗メール空:', tag)
    elif not EMAIL_RE.match(m.strip().lower()): P('- 店舗メール形式が不正:', tag, repr(m))
    if unicodedata.normalize('NFKC', s) != s and s not in old_by: P('- 半角/全角ゆれの可能性:', tag)

P('\n# 2. 旧→新の差分（エリア/テリトリー移動・メール変更）')
new_by = {x[2].strip(): x for x in new}
for s, x in new_by.items():
    o = old_by.get(s)
    if not o: P('- 新規店舗:', s, x[0], x[1], x[3] or '(メール空)'); continue
    if (o[0], o[1]) != (x[0].strip(), x[1].strip()): P('- 移動:', s, '%s/%s → %s/%s' % (o[0], o[1], x[0].strip(), x[1].strip()))
    if o[3].strip().lower() != x[3].strip().lower(): P('- メール変更:', s, repr(o[3]), '→', repr(x[3]))
for s in old_by:
    if s not in new_by: P('- 旧にのみ存在（消える）:', s, old_by[s][0], old_by[s][1])
terr = defaultdict(list)
for x in new:
    if '本部' in x[0]: continue
    terr[(x[0].strip(), x[1].strip())].append(x[2].strip())
P('\n# 3. 新組織のテリトリー構成')
for k in sorted(terr): P('- %s %s（%d店）: %s' % (k[0], k[1], len(terr[k]), '、'.join(terr[k])))

P('\n# 4. 26年度EAST10/1 との照合（店舗名・店舗メール）')
ws = g('26')
alias = {n('分倍河原'): 'MINANO分倍河原', n('J+麻布十番'): 'JOYFIT＋麻布十番', n('川崎砂子2丁目'): '川崎砂子二丁目',
         n('FIT365柏松ヶ崎'): 'FIT365イオン松ヶ崎', n('FIT365コープ葛飾白鳥'): 'FIT365葛飾白鳥',
         n('FIT365Qiz MALL龍ヶ崎'): 'FIT365龍ヶ崎', n('FIT365稲城'): 'FIT365稲城SANWA'}
new_norm = {n(k): k for k in new_by}
seen26 = set()
emp_emails = set(raw(r[1]).strip().lower() for r in g('従業員データ').iter_rows(min_row=2, values_only=True) if r[1])
notify = defaultdict(list)
for r in ws.iter_rows(min_row=3):
    st = raw(r[1].value).strip()
    if not st: continue
    status = raw(r[0].value).strip()
    key = alias.get(n(st)) or new_norm.get(n(st))
    if status:
        P('- 26シート備考「%s」: %s' % (status, st), '（新店舗データに%s）' % ('ある' if key else '無い'))
        continue
    if not key: P('- 26シートの店舗が新店舗データに無い:', st); continue
    seen26.add(key)
    m26 = raw(r[2].value)
    if m26 != m26.strip() or m26.strip().endswith('/'): P('- 26シート店舗メールに余計な文字:', st, repr(m26))
    m26c = m26.strip().rstrip('/').strip().lower()
    mnew = new_by[key][3].strip().lower()
    if m26c != mnew: P('- 店舗メール不一致:', key, '新店舗データ=%r / 26シート=%r' % (mnew, m26c))
    emails = []
    for c in r[3:]:
        v = raw(c.value)
        if not v.strip(): continue
        e = v.strip().lower()
        if v != v.strip(): P('- 26シート通知先に空白:', st, c.coordinate, repr(v))
        if not EMAIL_RE.match(e): P('- 26シート通知先の形式不正:', st, c.coordinate, repr(v))
        if e in emails: P('- 同じ店舗に同じ通知先が重複:', st, e)
        emails.append(e)
        notify[e].append(key)
    if not emails: P('- 通知先が0人:', st)
for k in new_by:
    if k not in seen26 and '本部' not in new_by[k][0] and k: P('- 新店舗データにあるが26シートに通知先行が無い:', k)
P('\n# 5. 26シートの通知先で従業員データに未登録のアドレス')
for e in sorted(notify):
    if e not in emp_emails: P('-', e, '、'.join(notify[e]))

P('\n# 6. 担当者ごとの新管轄がエリアをまたぐケース（参考）')
area_of = {k: v[0].strip() for k, v in new_by.items()}
roles = {raw(r[1]).strip().lower(): (raw(r[0]).strip(), raw(r[6]).strip()) for r in g('従業員データ').iter_rows(min_row=2, values_only=True) if r[1]}
for e, sts in sorted(notify.items()):
    areas = sorted(set(area_of.get(s, '?') for s in sts))
    nm, ro = roles.get(e, ('未登録', ''))
    if len(areas) > 1 and ro not in ('SMG', 'A-SMG', 'GMG'):
        P('- %s（%s）: %s → %s' % (nm, ro, '、'.join(areas), '、'.join(sts)))

url = 'https://docs.google.com/spreadsheets/d/%s/gviz/tq?tqx=out:csv&sheet=%s&headers=1&tq=%s' % (SS, urllib.parse.quote('申請データ'), urllib.parse.quote('select A,P,Q'))
rows = list(csv.reader(io.StringIO(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})).read().decode('utf-8-sig'))))
st = [r for r in rows[1:] if r[1] == 'store']
P('\n# 7. 申請データQ列: 店舗依頼 %d件中 %d件 書き込み済み' % (len(st), sum(1 for r in st if r[2].strip())))
with open('docs/gas/_tmp_check.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
