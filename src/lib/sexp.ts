export type Sexp = string | Sexp[]

/** Strip ;; line comments and #| ... |# block comments (kanata rules). */
export function stripKanataComments(source: string): string {
  let out = ''
  let i = 0
  while (i < source.length) {
    if (source[i] === '#' && source[i + 1] === '|') {
      i += 2
      while (i < source.length && !(source[i] === '|' && source[i + 1] === '#')) {
        i += 1
      }
      i += 2
      continue
    }
    if (source[i] === ';' && source[i + 1] === ';') {
      while (i < source.length && source[i] !== '\n') i += 1
      continue
    }
    out += source[i]
    i += 1
  }
  return out
}

function tokenize(source: string): string[] {
  const cleaned = stripKanataComments(source)
  const tokens: string[] = []
  let i = 0

  while (i < cleaned.length) {
    const ch = cleaned[i]
    if (/\s/.test(ch)) {
      i += 1
      continue
    }
    if (ch === '(' || ch === ')') {
      tokens.push(ch)
      i += 1
      continue
    }
    if (ch === '"') {
      let j = i + 1
      while (j < cleaned.length && cleaned[j] !== '"') j += 1
      tokens.push(cleaned.slice(i, j + 1))
      i = j + 1
      continue
    }
    let j = i
    while (j < cleaned.length && !/\s/.test(cleaned[j]) && cleaned[j] !== '(' && cleaned[j] !== ')') {
      j += 1
    }
    tokens.push(cleaned.slice(i, j))
    i = j
  }

  return tokens
}

function parseTokens(tokens: string[], index: { i: number }): Sexp {
  const token = tokens[index.i]
  if (token === undefined) {
    throw new Error('Unexpected end of kanata config')
  }
  if (token === '(') {
    index.i += 1
    const list: Sexp[] = []
    while (tokens[index.i] !== ')') {
      if (tokens[index.i] === undefined) {
        throw new Error('Unclosed ( in kanata config')
      }
      list.push(parseTokens(tokens, index))
    }
    index.i += 1
    return list
  }
  if (token === ')') {
    throw new Error('Unexpected ) in kanata config')
  }
  index.i += 1
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1)
  }
  return token
}

/** Parse a kanata .kbd file into top-level S-expression lists. */
export function parseKanataSource(source: string): Sexp[] {
  const tokens = tokenize(source)
  const forms: Sexp[] = []
  const index = { i: 0 }
  while (index.i < tokens.length) {
    forms.push(parseTokens(tokens, index))
  }
  return forms
}

export function isList(value: Sexp): value is Sexp[] {
  return Array.isArray(value)
}

export function atom(value: Sexp): string {
  if (typeof value !== 'string') {
    throw new Error('Expected atom, got list')
  }
  return value
}
