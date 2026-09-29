import os, re, unicodedata, openpyxl
wb = openpyxl.load_workbook(os.path.join(os.environ['TEMP'], 'todo.xlsx'))
def sh(prefix):
    return [w for w in wb.worksheets if w.title.startswith(prefix)][0]

def norm(s):
    s = unicodedata.normalize('NFKC', str(s or '')).strip()
    s = re.sub(r'\s+', '', s)
    return s.lower()

def em(s):
    return str(s or '').strip().strip('/').strip().lower()

old_st = [(str(r[0] or '').strip(), str(r[1] or '').strip(), str(r[2] or '').strip()) for r in sh('店舗データ').iter_rows(min_row=2, values_only=True) if r[2]]
new_st = [(str(r[0] or '').strip(), str(r[1] or '').strip(), str(r[2] or '').strip()) for r in sh('新店舗データ').iter_rows(min_row=2, values_only=True) if r[2]]
new_names = {norm(s[2]): s[2] for s in new_st}
old_names = {norm(s[2]): s[2] for s in old_st}
alias = {
    norm('分倍河原'): 'MINANO分倍河原',
    norm('J+麻布十番'): 'JOYFIT＋麻布十番',
    norm('川崎砂子2丁目'): '川崎砂子二丁目',
    norm('FIT365柏松ヶ崎'): 'FIT365イオン松ヶ崎',
    norm('FIT365コープ葛飾白鳥'): 'FIT365葛飾白鳥',
    norm('FIT365Qiz MALL龍ヶ崎'): 'FIT365龍ヶ崎',
    norm('FIT365稲城'): 'FIT365稲城SANWA',
    norm('京王堀之内'): '京王堀之内',
    norm('FIT365京王堀之内'): 'FIT365京王堀之内',
}

def to_new_name(raw):
    n = norm(raw)
    if n in alias: return alias[n], '（名称ゆれ: %s）' % raw
    if n in new_names: return new_names[n], ''
    for k, v in new_names.items():
        if n and (n in k or k in n): return v, '（名称ゆれ: %s）' % raw
    return raw, '（新店舗データに無い）'

ws = sh('26')
mapping = {}  # email -> set(store)
store_rows = []
unmatched = []
for r in ws.iter_rows(min_row=3):
    a = r[0].value; b = r[1].value
    if not b: continue
    closed = a and ('閉店' in str(a) or 'リブランド' in str(a))
    name, note = to_new_name(b)
    if note: unmatched.append('%s → %s %s' % (b, name, note))
    if closed: continue
    for c in r[3:]:
        e = em(c.value)
        if '@' in e and not e.startswith(('jf', 'joyfit', 'fit365')):
            mapping.setdefault(e, [])
            if name not in mapping[e]: mapping[e].append(name)

emps = []
for r in sh('従業員データ').iter_rows(min_row=2, values_only=True):
    if not r[1]: continue
    stores = [str(x).strip() for x in r[7:57] if x and str(x).strip()]
    emps.append((str(r[0]).strip(), em(r[1]), str(r[6] or '').strip(), stores))
emp_by = {e[1]: e for e in emps}

lines = ['## 新組織シートに載っている通知先アドレス（従業員データと照合）']
same = []; diff = []
for e in sorted(mapping):
    newl = mapping[e]
    if e not in emp_by:
        continue
    name, _, role, cur = emp_by[e]
    add = [s for s in newl if s not in cur]
    rem = [s for s in cur if s not in newl]
    if not add and not rem:
        same.append('%s（%s）' % (name, role))
    else:
        diff.append('%s（%s / %s）\n  現在: %s\n  新: %s\n  追加: %s\n  外れる: %s' % (name, role, e, '、'.join(cur), '、'.join(newl), '、'.join(add) or '-', '、'.join(rem) or '-'))
lines.append('### 変更あり %d名' % len(diff)); lines += diff
lines.append('### 変更なし %d名: %s' % (len(same), '、'.join(same)))
lines.append('### 新シートにいるが従業員データ未登録')
lines += ['%s: %s' % (e, '、'.join(mapping[e])) for e in sorted(mapping) if e not in emp_by]
lines.append('### 従業員データで店舗を持つが新シートに不在')
lines += ['%s（%s / %s）: %s' % (n, ro, e, '、'.join(s)) for n, e, ro, s in emps if s and e not in mapping]
lines.append('### 店舗名の照合')
lines += unmatched
listed = set(to_new_name(r[1].value)[0] for r in ws.iter_rows(min_row=3) if r[1].value)
lines.append('### 新店舗データにあるが新シートに無い店舗')
lines += [s[2] for s in new_st if s[2] not in listed]
with open('docs/gas/_tmp_cmp.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
