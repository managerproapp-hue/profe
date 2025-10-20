import { TeacherData, InstituteData } from './types';

// Declare the libraries loaded from CDN
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
    const { orientation = 'portrait' } = options;

    if (typeof jspdf === 'undefined') {
        alert("La librería para generar PDF (jsPDF) no está disponible. Por favor, recargue la página.");
        return;
    }

    const { jsPDF } = jspdf;
    
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
        table { width: 100%; border-collapse: collapse; font-size: 9pt; }
        th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
    `;
    
    contentContainer.innerHTML = `<style>${styles}</style><div id="pdf-content">${contentHtml}</div>`;
    document.body.appendChild(contentContainer);

    const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const headerHeight = 25; // Increased space for a better header
    const footerHeight = 15;

    pdf.html(contentContainer, {
        callback: async function (doc: any) {
            const teacherData = getStoredData<TeacherData>('teacher-app-data', { name: 'Profesor', email: '' });
            const instituteData = getStoredData<InstituteData>('institute-app-data', { name: 'Instituto', address: '', cif: '' });

            const totalPages = doc.internal.getNumberOfPages();
            
            const logoHeight = 12;
            let instituteLogoRenderWidth = 0;
            let teacherLogoRenderWidth = 0;

            if (instituteData.logo) {
                try { 
                    const dims = await getImageDimensions(instituteData.logo);
                    instituteLogoRenderWidth = (dims.width / dims.height) * logoHeight;
                } catch(e) { console.error("Error adding institute logo", e); }
            }
            if (teacherData.logo) {
                 try { 
                    const dims = await getImageDimensions(teacherData.logo);
                    teacherLogoRenderWidth = (dims.width / dims.height) * logoHeight;
                } catch(e) { console.error("Error adding teacher logo", e); }
            }
            
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                
                // --- HEADER ---
                const headerStartY = 8;
                if (instituteData.logo && instituteLogoRenderWidth > 0) {
                    doc.addImage(instituteData.logo, 'PNG', margin, headerStartY, instituteLogoRenderWidth, logoHeight, undefined, 'FAST');
                }
                if (teacherData.logo && teacherLogoRenderWidth > 0) {
                    doc.addImage(teacherData.logo, 'PNG', pdfWidth - margin - teacherLogoRenderWidth, headerStartY, teacherLogoRenderWidth, logoHeight, undefined, 'FAST'); 
                }

                doc.setFontSize(8);
                doc.setTextColor(80, 80, 80);
                doc.text(instituteData.name, margin + instituteLogoRenderWidth + 2, headerStartY + logoHeight / 2 + 1.5);
                doc.text(teacherData.name, pdfWidth - margin - teacherLogoRenderWidth - 2, headerStartY + logoHeight / 2 + 1.5, { align: 'right' });
                
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(20, 20, 20);
                doc.text(title, pdfWidth / 2, headerStartY + 7, { align: 'center' });

                doc.setDrawColor(229, 231, 235);
                doc.line(margin, headerHeight - 5, pdfWidth - margin, headerHeight - 5);

                // --- FOOTER ---
                const pageNumText = `Página ${i} de ${totalPages}`;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(150, 150, 150);
                doc.text(new Date().toLocaleDateString(), margin, pdf.internal.pageSize.getHeight() - margin + 4);
                doc.text(pageNumText, pdfWidth - margin, pdf.internal.pageSize.getHeight() - margin + 4, { align: 'right' });
            }
            
            doc.save(`${fileName}.pdf`);
            document.body.removeChild(contentContainer);
        },
        margin: [headerHeight, margin, footerHeight, margin],
        autoPaging: 'text',
        width: pdfWidth - (margin * 2),
        windowWidth: contentContainer.scrollWidth,
        html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true
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