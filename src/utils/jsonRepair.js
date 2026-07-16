/**
 * Attempts to repair common JSON malformations from LLM outputs.
 * 
 * @param {string} rawString - The raw string from the AI.
 * @returns {object} - The parsed JSON object.
 * @throws {Error} - If parsing fails after repair attempts.
 */
export function repairAndParseJSON(rawString) {
  let cleaned = rawString.trim()

  // 1. Remove Markdown block markers
  cleaned = cleaned.replace(/^```json\s*/i, "")
  cleaned = cleaned.replace(/^```\s*/, "")
  cleaned = cleaned.replace(/\s*```$/, "")
  cleaned = cleaned.trim()

  // 2. Crop to actual JSON boundary (find first '{' or '[' and last '}' or ']')
  const firstBrace = cleaned.indexOf("{")
  const firstBracket = cleaned.indexOf("[")
  
  let startIndex = -1
  let isObject = true

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace
    isObject = true
  } else if (firstBracket !== -1) {
    startIndex = firstBracket
    isObject = false
  }

  if (startIndex === -1) {
    throw new Error("No JSON boundaries found in string.")
  }

  const lastBrace = cleaned.lastIndexOf("}")
  const lastBracket = cleaned.lastIndexOf("]")
  const endIndex = isObject ? lastBrace : lastBracket

  if (endIndex === -1 || endIndex < startIndex) {
    // If we have an unclosed structure, we will try to balance it below,
    // but for cropping, we just crop from startIndex to the end of the string.
    cleaned = cleaned.substring(startIndex)
  } else {
    cleaned = cleaned.substring(startIndex, endIndex + 1)
  }

  // 3. Fix trailing commas (e.g. {"key": "val",} or [1, 2,])
  // This matches a comma followed by whitespace and a closing brace/bracket
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1")

  // 4. Clean up stray controls or double escapes
  // (Avoid breaking valid escapes but fix common LLM escape bugs)
  cleaned = cleaned.replace(/\\n/g, "\n").replace(/\\t/g, "\t")

  // 5. Attempt bracket balancing (useful if response truncated)
  cleaned = balanceBrackets(cleaned)

  try {
    return JSON.parse(cleaned)
  } catch (error) {
    console.error("JSON Repair failed. Attempted string:", cleaned)
    throw new Error(`JSON parse error after repair: ${error.message}`)
  }
}

/**
 * Automatically appends missing closing braces or brackets.
 */
function balanceBrackets(str) {
  const stack = []
  let inString = false
  let escaped = false

  for (let i = 0; i < str.length; i++) {
    const char = str[i]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === "{" || char === "[") {
      stack.push(char)
    } else if (char === "}") {
      if (stack[stack.length - 1] === "{") {
        stack.pop()
      }
    } else if (char === "]") {
      if (stack[stack.length - 1] === "[") {
        stack.pop()
      }
    }
  }

  // If there are unclosed structures, close them in reverse order
  let balanced = str
  while (stack.length > 0) {
    const openChar = stack.pop()
    if (openChar === "{") {
      balanced += "}"
    } else if (openChar === "[") {
      balanced += "]"
    }
  }

  return balanced
}
