import { FunctionDef } from './functionDefs';

class TrieNode {
    children: Record<string, TrieNode> = {};
    isEndOfWord: boolean = false;
    functionDef: FunctionDef | null = null;
}

export class CommandAutocompleteService {
    private root: TrieNode = new TrieNode();

    public buildTrie(functions: FunctionDef[], lang: 'es' | 'en' = 'es') {
        this.root = new TrieNode();
        functions.forEach(fn => {
            if (fn.proximamente) return; // Skip non-implemented
            const word = lang === 'es' ? fn.name : fn.english;
            this.insert(word, fn);
        });
    }

    private insert(word: string, def: FunctionDef) {
        let node = this.root;
        for (const char of word.toLowerCase()) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
        node.functionDef = def;
    }

    public searchPrefix(prefix: string, limit: number = 5): FunctionDef[] {
        let node = this.root;
        for (const char of prefix.toLowerCase()) {
            if (!node.children[char]) {
                return [];
            }
            node = node.children[char];
        }

        const results: FunctionDef[] = [];
        this.collectAllWords(node, results);
        return results.slice(0, limit);
    }

    private collectAllWords(node: TrieNode, results: FunctionDef[]) {
        if (node.isEndOfWord && node.functionDef) {
            results.push(node.functionDef);
        }
        for (const childKey in node.children) {
            this.collectAllWords(node.children[childKey], results);
        }
    }
}

// Singleton instance
export const autocompleteServiceES = new CommandAutocompleteService();
export const autocompleteServiceEN = new CommandAutocompleteService();

export function inicializarAutocompletado(funciones: FunctionDef[]) {
    autocompleteServiceES.buildTrie(funciones, 'es');
    autocompleteServiceEN.buildTrie(funciones, 'en');
}
