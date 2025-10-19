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
    }).then((canvas: any) => {
        document.body.removeChild(contentContainer);

        const teacherData = getStoredData<TeacherData>('teacher-app-data', { name: 'Profesor', email: '' });
        const instituteData = getStoredData<InstituteData>('institute-app-data', { name: 'Instituto', address: '', cif: '' });

        const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 10; // 1cm margin

        // --- 2. CALCULATE PAGE LAYOUT ---
        const headerHeight = minimalHeader ? 20 : 30;
        const footerHeight = 10; // 1cm empty footer
        const contentHeightPerPage = pdfHeight - headerHeight - footerHeight;

        const imgData = canvas.toDataURL('image/png');
        const contentImgWidth = pdfWidth - margin * 2;
        const contentImgHeight = (contentImgWidth / canvas.width) * canvas.height;
        
        const totalPages = Math.ceil(contentImgHeight / contentHeightPerPage);

        // --- 3. LOOP THROUGH PAGES AND BUILD PDF ---
        let yOffset = 0;
        for (let i = 1; i <= totalPages; i++) {
            if (i > 1) {
                pdf.addPage();
            }

            // --- A. ADD CONTENT SLICE ---
            // We add the full image but use a negative Y offset to "scroll" through it on each page.
            pdf.addImage(imgData, 'PNG', margin, -yOffset + headerHeight, contentImgWidth, contentImgHeight, undefined, 'FAST');

            // --- B. ADD HEADER ON TOP ---
            // Draw a white box to ensure the header area is clean
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, headerHeight, 'F'); 

            const pageNumText = `Página ${i} de ${totalPages}`;
            const headerStartY = 8;
            const logoHeight = minimalHeader ? 8 : 12;
            const logoWidth = 30;

            if (instituteData.logo) {
                try { pdf.addImage(instituteData.logo, 'PNG', margin, headerStartY, logoWidth, logoHeight, undefined, 'FAST'); } catch(e) { console.error("Error adding institute logo", e); }
            }
            if (teacherData.logo) {
                 try { pdf.addImage(teacherData.logo, 'PNG', pdfWidth - margin - logoWidth, headerStartY, logoWidth, logoHeight, undefined, 'FAST'); } catch(e) { console.error("Error adding teacher logo", e); }
            }

            // Institute & Teacher Names
            pdf.setFontSize(minimalHeader ? 8 : 10);
            pdf.setTextColor(80, 80, 80);
            pdf.text(instituteData.name, margin + (instituteData.logo ? logoWidth + 2 : 0), headerStartY + logoHeight / 2 + 1);
            pdf.text(teacherData.name, pdfWidth - margin - (teacherData.logo ? logoWidth + 2 : 0), headerStartY + logoHeight / 2 + 1, { align: 'right' });
            
            // Page Number
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(pageNumText, pdfWidth / 2, headerStartY + logoHeight / 2, { align: 'center' });

            // Document Title
            pdf.setFontSize(minimalHeader ? 12 : 16);
            pdf.setTextColor(20, 20, 20);
            pdf.text(title, pdfWidth / 2, headerHeight - 6, { align: 'center' });

            // Header line
            pdf.setDrawColor(229, 231, 235); // gray-200
            pdf.line(margin, headerHeight - 3, pdfWidth - margin, headerHeight - 3);

            // --- C. ADD FOOTER SPACE ---
            // Draw a white box for a clean empty footer
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, pdfHeight - footerHeight, pdfWidth, footerHeight, 'F'); 

            yOffset += contentHeightPerPage;
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
