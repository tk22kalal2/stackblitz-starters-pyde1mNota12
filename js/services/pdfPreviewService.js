import { renderPdf } from './pdfRenderer.js';

export class PDFPreviewService {
  constructor() {
    this.previewContainer = document.getElementById('pdfPreview');
    this.splitPreviewContainer = document.getElementById('splitPreview');
  }

  async showOriginalPreview(pdfBytes) {
    this.previewContainer.style.display = 'block';
    this.splitPreviewContainer.style.display = 'none';
    await renderPdf(pdfBytes, this.previewContainer);
  }

  async showSplitPreview(pdfBytes) {
    this.previewContainer.style.display = 'none';
    this.splitPreviewContainer.style.display = 'block';
    await renderPdf(pdfBytes, this.splitPreviewContainer);
  }

  hideAllPreviews() {
    this.previewContainer.style.display = 'none';
    this.splitPreviewContainer.style.display = 'none';
  }
}