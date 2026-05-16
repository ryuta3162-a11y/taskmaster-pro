import fs from 'fs';

const p = 'src/App.jsx';
let s = fs.readFileSync(p, 'utf8');

const openTag = '<div className={appSection}>';
const marker = '{num}. 配信するエリア・店舗';
const i = s.indexOf(marker);
if (i < 0) throw new Error('marker not found');
const pos = s.lastIndexOf(openTag, i);
if (pos < 0) throw new Error('appSection open not found');
s = s.slice(0, pos) + '<PanelFrame>' + s.slice(pos + openTag.length);

const endMarker = 'if (mode === REQUEST_KIND.employee)';
const blockEnd = s.indexOf(endMarker, i);
const closePos = s.lastIndexOf('</motion.div>', blockEnd);
const closePosReal = s.lastIndexOf('</div>', blockEnd);
const gridCloseReal = s.lastIndexOf('</div>', closePosReal - 1);
const outerClose = s.lastIndexOf('</div>', gridCloseReal - 1);
if (outerClose < 0) throw new Error('outer close not found');
s = s.slice(0, outerClose) + '</PanelFrame>' + s.slice(outerClose + 6);

fs.writeFileSync(p, s);
console.log('ok');
