import pdfParse from "pdf-parse"
import mammoth from "mammoth"

// @desc    Extract text from uploaded PDF, DOCX, TXT, or Markdown file
// @route   POST /api/parse-file
// @access  Private
export const parseFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Validation Error", message: "Please upload a file." })
  }

  const { originalname, buffer, mimetype } = req.file
  const extension = originalname.split(".").pop().toLowerCase()

  try {
    let extractedText = ""

    if (extension === "txt" || extension === "md" || mimetype === "text/plain" || mimetype === "text/markdown") {
      // Parse plain text or Markdown
      extractedText = buffer.toString("utf-8")
    } else if (extension === "pdf" || mimetype === "application/pdf") {
      // Parse PDF using pdf-parse
      const pdfData = await pdfParse(buffer)
      extractedText = pdfData.text
    } else if (extension === "docx" || mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      // Parse DOCX using mammoth
      const docxData = await mammoth.extractRawText({ buffer })
      extractedText = docxData.value
    } else {
      return res.status(400).json({
        error: "Unsupported File Format",
        message: `The file format '.${extension}' is not supported. Please upload a PDF, DOCX, TXT, or Markdown file.`
      })
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(422).json({
        error: "Unprocessable Entity",
        message: "The uploaded file is empty or no readable text could be extracted."
      })
    }

    res.json({
      filename: originalname,
      size: req.file.size,
      text: extractedText
    })
  } catch (error) {
    console.error("File parsing error:", error)
    res.status(500).json({
      error: "Parsing Failure",
      message: `Failed to extract text from the uploaded file: ${error.message}`
    })
  }
}
