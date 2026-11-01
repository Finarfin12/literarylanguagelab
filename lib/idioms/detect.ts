// Pembungkus aplikasi: data idiom bawaan + fungsi deteksi murni dari ./index. Pola dikompilasi sekali per proses.

import { IDIOM_SOURCES } from "./db";
import { compileIdioms, detectIdioms, type IdiomMatch } from "./index";

export type { IdiomMatch };

const COMPILED = compileIdioms(IDIOM_SOURCES);

export function detectIdiomsInText(text: string): IdiomMatch[] {
  return detectIdioms(text, COMPILED);
}
