// D:\\dev\\alphabook_project\\alphabook_web\\src\\lib\\specifications.ts
import fs from 'fs';
import path from 'path';

let specifications: any = null;

export function getSpecifications() {
  if (specifications) {
    return specifications;
  }

  const filePath = path.join(process.cwd(), 'src', 'lib', 'especificacoes.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  specifications = JSON.parse(fileContent);

  return specifications;
}
