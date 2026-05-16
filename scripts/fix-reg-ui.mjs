import fs from 'fs';

const p = 'src/App.jsx';
let s = fs.readFileSync(p, 'utf8');

const teamBlock = `                <label className={appLabel}>チーム名（複数選択可） <span className="text-rose-500">*</span></label>
                <PanelFrame className="mt-2">
                  <div className={\`flex flex-wrap gap-2 \${appChipArena}\`}>
                  {TEAMS.map(t => (
                    <RegChip key={t} selected={regData.team.includes(t)} onClick={() => toggleTeam(t)}>{t}</RegChip>
                  ))}
                  </div>
                </PanelFrame>`;

const areaBlock = `                <label className={appLabel}>エリア（複数選択可） <span className="text-rose-500">*</span></label>
                <PanelFrame className="mt-2">
                  <motion.div className={\`flex flex-wrap gap-2 \${appChipArena}\`}>
                  {AREAS.map(a => (
                    <RegChip key={a} selected={regData.area.includes(a)} onClick={() => toggleArea(a)}>{a}</RegChip>
                  ))}
                  </motion.div>
                </PanelFrame>`;

// fix motion in areaBlock
const areaBlockFixed = areaBlock.replace(/motion\.div/g, 'motion.div').replace(/<motion\.div/g, '<div').replace(/<\/motion\.motion\./g, '</div>');

s = s.replace(
  /                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">チーム名（複数選択可）[\s\S]*?                <\/div>\n              <\/motion.div>/,
  teamBlock
);

s = s.replace(
  /                <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">エリア（複数選択可）[\s\S]*?                <\/div>\n              <\/motion.div>/,
  areaBlockFixed
);

// territory block
s = s.replace(
  /                  <label className="text-sm font-black text-black uppercase mb-3 block tracking-widest">テリトリー（不要なものはタップして外す）[\s\S]*?                  <\/div>\n                <\/motion.div>\n              \)\}/,
  `                  <label className={appLabel}>テリトリー（不要なものはタップして外す） <span className="text-rose-500">*</span></label>
                  <PanelFrame className="mt-2 space-y-6">
                    {regData.area.map(areaName => (
                      <div key={areaName} className="border-b border-[var(--acc-200)]/40 pb-5 last:border-0 last:pb-0">
                        <p className="text-sm font-semibold text-[var(--acc-700)] mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-[var(--acc-500)]"></span>{areaName}</p>
                        <div className={\`flex flex-wrap gap-2 \${appChipArena}\`}>
                          {getTerritories(areaName).map(terr => {
                             const isSelected = regData.territory[areaName]?.includes(terr);
                             return (
                              <RegChip key={terr} selected={isSelected} onClick={() => toggleTerritory(areaName, terr)}>{terr}</RegChip>
                            );
                          })}
                        </motion.div>
                      </motion.div>
                    ))}
                  </PanelFrame>
                </motion.div>
              )}`
);

fs.writeFileSync(p, s);
console.log('done');
