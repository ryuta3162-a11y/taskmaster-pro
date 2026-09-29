import os, time, urllib.request, openpyxl
SS = '1-ww_0rDYxmA6Mlrl1GUJtG_agE2z760cdvQ7oMIQqkc'
p = os.path.join(os.environ['TEMP'], 'todo_poll2.xlsx')
for i in range(40):
    urllib.request.urlretrieve('https://docs.google.com/spreadsheets/d/%s/export?format=xlsx' % SS, p)
    wb = openpyxl.load_workbook(p)
    if '集計_月別' in wb.sheetnames:
        time.sleep(60)
        urllib.request.urlretrieve('https://docs.google.com/spreadsheets/d/%s/export?format=xlsx' % SS, p)
        wb = openpyxl.load_workbook(p)
        print('DONE', time.strftime('%H:%M:%S'))
        for w in wb.worksheets:
            print(' ', w.title, w.sheet_state, w.max_row, 'x', w.max_column)
        for name in ['集計_依頼一覧', '集計_社員別', '集計_店舗別', '集計_月別']:
            ws = wb[name]
            print('==', name, ws['A1'].value)
            for r in ws.iter_rows(min_row=2, max_row=4, values_only=True):
                print('   ', [x for x in r][:11])
        emp = wb['従業員データ']
        print('validation count', len(emp.data_validations.dataValidation), 'cf', len(emp.conditional_formatting))
        break
    time.sleep(45)
else:
    print('NOT YET', time.strftime('%H:%M:%S'))
