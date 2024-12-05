import { showLoading, hideLoading, showError } from './uiHelpers.js';
import { readFileAsArrayBuffer } from '../services/pdfService.js';
import { splitPdf } from '../services/pdfSplitter.js';
import { performOCR } from '../services/ocrProcessor.js';
import { generateNotes } from '../services/notesGenerator.js';
import { initializeEditor, updateEditorContent } from '../editor/notesEditor.js';
import { PDFPreviewService } from '../services/pdfPreviewService.js';

let uploadedPdfBytes = null;
let splitPdfBytes = null;
let ocrText = "";
let pdfPreviewService = null;

export function setupEventListeners(elements) {
  pdfPreviewService = new PDFPreviewService();
  setupFileUploadHandler(elements);
  setupSplitButtonHandler(elements);
  setupOCRButtonHandler(elements);
  setupNotesButtonHandler(elements);
  setupSaveNotesHandler();
}

function setupFileUploadHandler(elements) {
  elements.pdfUpload.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        showLoading(elements.loadingIndicator);
        uploadedPdfBytes = await readFileAsArrayBuffer(file);
        
        // Show PDF preview and split controls
        await pdfPreviewService.showOriginalPreview(uploadedPdfBytes);
        elements.splitControls.style.display = "block";
        
        // Hide other sections
        elements.ocrControls.style.display = "none";
        elements.ocrTextPreview.style.display = "none";
        elements.notesControls.style.display = "none";
        elements.notesEditorContainer.style.display = "none";
      } catch (error) {
        console.error("Error uploading PDF:", error);
        showError(elements.pdfPreview, "Failed to load the PDF. Please try again.");
      } finally {
        hideLoading(elements.loadingIndicator);
      }
    }
  });
}

function setupSplitButtonHandler(elements) {
  elements.splitButton.addEventListener("click", async () => {
    const start = parseInt(elements.startPage.value, 10);
    const end = parseInt(elements.endPage.value, 10);
    
    if (!validateSplitInput(uploadedPdfBytes, start, end)) {
      showError(elements.splitPreview, "Invalid input. Please specify a valid page range.");
      return;
    }
    
    try {
      showLoading(elements.loadingIndicator);
      splitPdfBytes = await splitPdf(uploadedPdfBytes, start, end);
      
      // Show split preview and OCR controls
      await pdfPreviewService.showSplitPreview(splitPdfBytes);
      elements.ocrControls.style.display = "block";
    } catch (error) {
      console.error("Error splitting PDF:", error);
      showError(elements.splitPreview, "Failed to split the PDF. Please try again.");
    } finally {
      hideLoading(elements.loadingIndicator);
    }
  });
}

function setupOCRButtonHandler(elements) {
  elements.ocrButton.addEventListener("click", async () => {
    if (!splitPdfBytes) {
      showError(elements.ocrTextPreview, "No split PDF available. Please split the PDF first.");
      return;
    }
    
    try {
      showLoading(elements.loadingIndicator);
      
      // Hide split preview
      pdfPreviewService.hideAllPreviews();
      
      // Perform OCR and show results
      ocrText = await performOCR(splitPdfBytes);
      elements.ocrTextPreview.style.display = "block";
      elements.ocrTextPreview.innerHTML = `<h2>OCR Results</h2><pre>${ocrText}</pre>`;
      
      // Show notes controls
      elements.notesControls.style.display = "block";
    } catch (error) {
      console.error("Error performing OCR:", error);
      showError(elements.ocrTextPreview, "Failed to perform OCR. Please try again.");
    } finally {
      hideLoading(elements.loadingIndicator);
    }
  });
}

function setupNotesButtonHandler(elements) {
  elements.notesButton.addEventListener("click", async () => {
    if (!ocrText) {
      showError(elements.ocrTextPreview, "No OCR text available. Please perform OCR first.");
      return;
    }
    
    try {
      showLoading(elements.loadingIndicator);
      
      // Hide OCR preview
      elements.ocrTextPreview.style.display = "none";
      
      // Generate and show notes
      const notes = await generateNotes(ocrText);
      elements.notesEditorContainer.style.display = "block";
      await updateEditorContent(notes);
    } catch (error) {
      console.error("Error generating notes:", error);
      showError(elements.notesEditorContainer, "Failed to generate notes. Please try again.");
    } finally {
      hideLoading(elements.loadingIndicator);
    }
  });
}

function setupSaveNotesHandler() {
  document.getElementById('saveNotesButton').addEventListener('click', () => {
    const content = tinymce.get('notesEditor').getContent();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processed-notes.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function validateSplitInput(pdfBytes, start, end) {
  return pdfBytes && !isNaN(start) && !isNaN(end) && start > 0 && end >= start;
}