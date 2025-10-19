import { TeacherData, InstituteData } from './types';

// Declare the libraries loaded from CDN
declare var html2canvas: any;
declare var jspdf: any;

// Helper to fetch data safely from localStorage
const getStoredData = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

interface PdfOptions {
  orientation?: 'portrait' | 'landscape';
  minimalHeader?: boolean;
}

// Helper to get image dimensions from base64 string to preserve aspect ratio
const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = (err) => {
            console.error("Failed to load image from base64 for dimension calculation.");
            reject(err);
        };
        img.src = base64;
    });
};


/**
 * Generates and downloads a PDF file from an HTML content string, with headers and footers on each page.
 * @param title The title of the document.
 * @param contentHtml The HTML string of the content to be included in the PDF.
 * @param fileName The name of the file to be downloaded (without extension).
 * @param options Configuration options for the PDF.
 */
export const downloadAsPdf = (title: string, contentHtml: string, fileName: string, options: PdfOptions = {}) => {
    const { orientation = 'portrait', minimalHeader = false } = options;

    if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
        alert("Las librerías para generar PDF no están disponibles. Por favor, recargue la página.");
        return;
    }

    const { jsPDF } = jspdf;
    
    // --- 1. RENDER ONLY THE CONTENT TO A CANVAS ---
    const contentContainer = document.createElement('div');
    contentContainer.style.position = 'fixed';
    contentContainer.style.left = '-9999px';
    const contentWidthMm = (orientation === 'landscape' ? 297 : 210) - 20; // Page width - 2*1cm margin
    contentContainer.style.width = `${contentWidthMm}mm`;
    contentContainer.style.backgroundColor = 'white';
    contentContainer.style.boxSizing = 'border-box';
    
    const styles = `
        @import url('https://rsms.me/inter/inter.css');
        body { font-family: 'Inter', sans-serif; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
    `;
    
    contentContainer.innerHTML = `<style>${styles}</style><div id="pdf-content">${contentHtml}</div>`;
    document.body.appendChild(contentContainer);

    html2canvas(contentContainer, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true
    }).then(async (canvas: any) => {
        document.body.removeChild(contentContainer);

        const teacherData = getStoredData<TeacherData>('teacher-app-data', { name: 'Profesor', email: '' });
        const instituteData = getStoredData<InstituteData>('institute-app-data', { name: 'Instituto', address: '', cif: '' });

        const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10; // 1cm margin

        // --- 2. CALCULATE PAGE LAYOUT ---
        const headerHeight = 20; // Standard compact header
        const footerHeight = 15;
        const contentAreaHeight = pdfHeight - headerHeight - footerHeight;

        const imgData = canvas.toDataURL('image/png');
        const contentImgWidth = pdfWidth - margin * 2;
        const contentImgHeight = (contentImgWidth / canvas.width) * canvas.height;
        
        const totalPages = Math.ceil(contentImgHeight / contentAreaHeight);

        // --- 3. LOOP THROUGH PAGES AND BUILD PDF ---
        let yOffset = 0;
        for (let i = 1; i <= totalPages; i++) {
            if (i > 1) {
                pdf.addPage();
            }

            // --- A. ADD CONTENT SLICE ---
            pdf.addImage(imgData, 'PNG', margin, -yOffset + headerHeight, contentImgWidth, contentImgHeight, undefined, 'FAST');

            // --- B. ADD HEADER ON TOP ---
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, headerHeight, 'F'); 

            const headerStartY = 7;
            const logoHeight = 10;
            let instituteLogoRenderWidth = 0;
            let teacherLogoRenderWidth = 0;

            if (instituteData.logo) {
                try { 
                    const dims = await getImageDimensions(instituteData.logo);
                    instituteLogoRenderWidth = (dims.width / dims.height) * logoHeight;
                    pdf.addImage(instituteData.logo, 'PNG', margin, headerStartY, instituteLogoRenderWidth, logoHeight, undefined, 'FAST');
                } catch(e) { console.error("Error adding institute logo", e); }
            }
            if (teacherData.logo) {
                 try { 
                    const dims = await getImageDimensions(teacherData.logo);
                    teacherLogoRenderWidth = (dims.width / dims.height) * logoHeight;
                    pdf.addImage(teacherData.logo, 'PNG', pdfWidth - margin - teacherLogoRenderWidth, headerStartY, teacherLogoRenderWidth, logoHeight, undefined, 'FAST'); 
                } catch(e) { console.error("Error adding teacher logo", e); }
            }

            pdf.setFontSize(8);
            pdf.setTextColor(80, 80, 80);
            pdf.text(instituteData.name, margin + instituteLogoRenderWidth + 2, headerStartY + logoHeight / 2 + 1);
            pdf.text(teacherData.name, pdfWidth - margin - teacherLogoRenderWidth - 2, headerStartY + logoHeight / 2 + 1, { align: 'right' });
            
            pdf.setFontSize(14);
            pdf.setTextColor(20, 20, 20);
            pdf.text(title, pdfWidth / 2, headerStartY + 6, { align: 'center' });

            // Header line (provides space between header and content)
            pdf.setDrawColor(229, 231, 235);
            pdf.line(margin, headerHeight - 4, pdfWidth - margin, headerHeight - 4);

            // --- C. ADD FOOTER ---
            const pageNumText = `Página ${i} de ${totalPages}`;
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(pageNumText, pdfWidth - margin, pdfHeight - margin + 3, { align: 'right' });
            
            yOffset += contentAreaHeight;
        }

        pdf.save(`${fileName}.pdf`);

    }).catch((err: any) => {
        console.error("Error generating PDF:", err);
        alert("Hubo un error al generar el PDF.");
        if (document.body.contains(contentContainer)) {
            document.body.removeChild(contentContainer);
        }
    });
};


/**
 * Exports an array of data to an Excel file.
 * @param data The array of objects to export.
 * @param fileName The desired name for the output file (without extension).
 * @param sheetName The name for the sheet inside the Excel file.
 */
declare var XLSX: any;
export const exportToExcel = (data: any[], fileName: string, sheetName: string) => {
    if (typeof XLSX === 'undefined') {
        alert("La librería de exportación a Excel no está disponible.");
        return;
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};