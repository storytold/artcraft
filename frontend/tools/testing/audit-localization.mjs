import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '../../..');
const tracked = execFileSync('git', ['-c', `safe.directory=${root.replaceAll('\\','/')}`, 'ls-files'], {cwd: root, encoding:'utf8'}).split(/\r?\n/);
const en = JSON.parse(fs.readFileSync(path.join(root, 'frontend/libs/i18n/src/locales/en.json'), 'utf8'));
const zh = JSON.parse(fs.readFileSync(path.join(root, 'frontend/libs/i18n/src/locales/zh-CN.json'), 'utf8'));
const rows = [], calls = [], native = [];
const clean = s => s.replace(/\s+/g, ' ').trim();
const isEnglish = s => /[A-Za-z]{2}/.test(s) && !/^https?:|^data:|^#[\da-f]+$/i.test(s);
const attrs = new Set(['title','placeholder','label','alt','aria-label','description','tooltip','helperText','emptyMessage','text']);
function translated(node) {
  for(let p=node.parent;p;p=p.parent) {
    if(ts.isCallExpression(p) && /^(?:t|tr|translateUi|uiI18n\.t|i18n\.t)$/.test(p.expression.getText())) return true;
    if(ts.isJsxElement(p) && p.openingElement.tagName.getText()==='Trans') return true;
    if(ts.isJsxSelfClosingElement(p) && p.tagName.getText()==='LocalizedText') return true;
  }
  return false;
}
for(const file of tracked.filter(f=>/^frontend\/(apps\/artcraft\/|libs\/)/.test(f) && /\.(tsx?|jsx?)$/.test(f) && !/\.(spec|test|stories)\.|\/(__tests__|fixtures)\//.test(f))) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  function add(node,text,kind){text=clean(text);if(!isEnglish(text)||translated(node))return; rows.push({file,line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,kind,text,inCatalog:Object.hasOwn(en,text)});}
  function visit(n){
    if(ts.isCallExpression(n) && /^(?:t|tr|translateUi|uiI18n\.t|i18n\.t)$/.test(n.expression.getText()) && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) calls.push({file,key:n.arguments[0].text});
    if(ts.isJsxText(n)) add(n,n.text,'jsx-text');
    if(ts.isStringLiteralLike(n)) {
      const p=n.parent;
      if(ts.isJsxAttribute(p) && attrs.has(p.name.getText()))add(n,n.text,'jsx-attribute');
      else if(ts.isJsxExpression(p) && (ts.isJsxElement(p.parent)||ts.isJsxFragment(p.parent)))add(n,n.text,'jsx-expression');
      else if(ts.isJsxExpression(p) && ts.isJsxAttribute(p.parent) && attrs.has(p.parent.name.getText()))add(n,n.text,'jsx-attribute');
      else if(ts.isPropertyAssignment(p) && attrs.has(p.name.getText().replaceAll(/['"]/g,''))) add(n,n.text,'review-object-label');
      else if(ts.isCallExpression(p) && /(?:toast\.(?:error|success|info|warning)|alert|confirm)$/.test(p.expression.getText()))add(n,n.text,'notification');
    }
    ts.forEachChild(n,visit);
  }visit(ast);
}
for(const file of tracked.filter(f=>/^artcraft-native\/src\//.test(f)&&f.endsWith('.rs'))) {
  fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/).forEach((line,index)=>{
    if(line.includes('crate::i18n::is_chinese()'))return;
    if(!/(?:ui\.(?:label|button|heading|checkbox|radio_value|selectable_label)|RichText::new|widgets::(?:heading|button|hud|section_label|badge|pill|ghost|overlay_icon|generate_button|menu_header|menu_row|hud_link)|hint_text|on_hover_text)/.test(line)||/^\s*\/\//.test(line))return;
    for(const m of line.matchAll(/"((?:\\.|[^"\\])*)"/g))if(isEnglish(m[1]) && !line.slice(Math.max(0,m.index-16),m.index).endsWith("ui_text("))native.push({file,line:index+1,text:m[1]});
  });
}
const countGroups=(items,key)=>Object.entries(items.reduce((a,r)=>{const k=key(r);a[k]=(a[k]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]);
const report={upstream:execFileSync('git',['-c',`safe.directory=${root.replaceAll('\\','/')}`,'rev-parse','origin/main'],{cwd:root,encoding:'utf8'}).trim(),catalog:{en:Object.keys(en).length,zh:Object.keys(zh).length,missing:Object.keys(en).filter(k=>!Object.hasOwn(zh,k)),extra:Object.keys(zh).filter(k=>!Object.hasOwn(en,k)),identical:Object.keys(en).filter(k=>en[k]===zh[k])},literalTranslationCallsMissing:[...new Set(calls.filter(r=>!Object.hasOwn(en,r.key) && !Object.hasOwn(en,r.key+'_one') && !Object.hasOwn(en,r.key+'_other')).map(r=>r.key))],frontend:{occurrences:rows.length,uniqueStrings:new Set(rows.map(r=>r.text)).size,files:new Set(rows.map(r=>r.file)).size,kinds:countGroups(rows,r=>r.kind),groups:countGroups(rows,r=>r.file.startsWith('frontend/apps/')?'app':r.file.split('/').slice(2,4).join('/')),rows},native:{occurrences:native.length,uniqueStrings:new Set(native.map(r=>r.text)).size,files:new Set(native.map(r=>r.file)).size,rows:native}};
const output=process.argv[2]; if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,frontend:{...report.frontend,rows:undefined},native:{...report.native,rows:undefined}},null,2));
