import { TeacherData, InstituteData } from './types';

// Declare the libraries loaded from CDN
declare var jspdf: any;
declare var XLSX: any;

// Augment the jsPDF interface to include the autoTable method from the plugin
declare global {
  namespace jspdf {
    interface jsPDF {
      autoTable: (options: any) => jsPDF;
      lastAutoTable: { finalY: number };
      putTotalPages: (pageExpression: string) => jsPDF;
    }
  }
}

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

interface PdfTableConfig {
    head: any[][];
    body: any[][];
    options?: any;
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
 * Generates a PDF with headers, footers, and multiple tables using jspdf-autotable.
 * @param title The main title of the document.
 * @param fileName The name for the downloaded file.
 * @param tables An array of table configurations to be rendered sequentially.
 * @param options PDF orientation options.
 */
export const downloadPdfWithTables = async (title: string, fileName: string, tables: PdfTableConfig[], options: PdfOptions = {}) => {
    if (typeof jspdf === 'undefined' || typeof (new jspdf.jsPDF()).autoTable === 'undefined') {
        alert("La librería para generar PDF (jsPDF/autoTable) no está disponible. Por favor, recargue la página.");
        return;
    }

    const { jsPDF } = jspdf;
    const { orientation = 'portrait' } = options;
    const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    
    const totalPagesExp = '{total_pages_count}';
    const headerHeight = 25;
    const footerHeight = 15;

    // --- Prepare Header/Footer Data ---
    const teacherData = getStoredData<TeacherData>('teacher-app-data', { name: 'Profesor', email: '' });
    const instituteData = getStoredData<InstituteData>('institute-app-data', { name: 'Instituto', address: '', cif: '' });

    const logoHeight = 12;
    let instituteLogo, teacherLogo;
    if (instituteData.logo) {
        try {
            const dims = await getImageDimensions(instituteData.logo);
            instituteLogo = { data: instituteData.logo, width: (dims.width / dims.height) * logoHeight, height: logoHeight };
        } catch(e) { console.error("Error processing institute logo", e); }
    }
    if (teacherData.logo) {
        try {
            const dims = await getImageDimensions(teacherData.logo);
            teacherLogo = { data: teacherData.logo, width: (dims.width / dims.height) * logoHeight, height: logoHeight };
        } catch(e) { console.error("Error processing teacher logo", e); }
    }

    // --- Draw Tables ---
    let startY: number | undefined = headerHeight;
    
    tables.forEach((tableConfig, index) => {
        doc.autoTable({
            head: tableConfig.head,
            body: tableConfig.body,
            startY: startY,
            margin: { top: headerHeight, bottom: footerHeight },
            theme: 'grid',
            headStyles: { fillColor: [243, 244, 246], textColor: [55, 65, 81], fontStyle: 'bold' },
            ...tableConfig.options,
            didDrawPage: (data: any) => {
                // --- HEADER ---
                const headerStartY = 8;
                if (instituteLogo) {
                    doc.addImage(instituteLogo.data, 'PNG', data.settings.margin.left, headerStartY, instituteLogo.width, instituteLogo.height);
                }
                if (teacherLogo) {
                    doc.addImage(teacherLogo.data, 'PNG', doc.internal.pageSize.getWidth() - data.settings.margin.right - teacherLogo.width, headerStartY, teacherLogo.width, teacherLogo.height);
                }

                doc.setFontSize(8);
                doc.setTextColor(80, 80, 80);
                doc.text(instituteData.name, data.settings.margin.left, headerStartY + logoHeight + 2);
                doc.text(teacherData.name, doc.internal.pageSize.getWidth() - data.settings.margin.right, headerStartY + logoHeight + 2, { align: 'right' });
                
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(20, 20, 20);
                doc.text(title, doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });

                doc.setDrawColor(229, 231, 235);
                doc.line(data.settings.margin.left, headerHeight - 5, doc.internal.pageSize.getWidth() - data.settings.margin.right, headerHeight - 5);

                // --- FOOTER ---
                const footerY = doc.internal.pageSize.getHeight() - 8;
                doc.setDrawColor(229, 231, 235);
                doc.line(data.settings.margin.left, doc.internal.pageSize.getHeight() - footerHeight + 2, doc.internal.pageSize.getWidth() - data.settings.margin.right, doc.internal.pageSize.getHeight() - footerHeight + 2);

                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(120, 120, 120);

                const pageNumText = `Página ${data.pageNumber} de ${totalPagesExp}`;
                doc.text(`${instituteData.name} - ${teacherData.name}`, data.settings.margin.left, footerY);
                doc.text(pageNumText, doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
                doc.text(new Date().toLocaleDateString(), doc.internal.pageSize.getWidth() - data.settings.margin.right, footerY, { align: 'right' });
            },
        });
        startY = doc.lastAutoTable.finalY + 8; // Space between tables
    });

    // Replace total page count placeholder
    if (typeof (doc as any).putTotalPages === 'function') {
        (doc as any).putTotalPages(totalPagesExp);
    }
    
    doc.save(`${fileName}.pdf`);
};

/**
 * [LEGACY] Generates and downloads a PDF file from an HTML content string using html2canvas.
 * Best for non-tabular, custom layouts like recipe cards.
 * @param title The title of the document.
 * @param contentHtml The HTML string of the content to be included in the PDF.
 * @param fileName The name of the file to be downloaded (without extension).
 * @param options Configuration options for the PDF.
 */
export const downloadPdfFromHtml = (title: string, contentHtml: string, fileName: string, options: PdfOptions = {}) => {
    const { orientation = 'portrait' } = options;

    if (typeof jspdf === 'undefined') {
        alert("La librería para generar PDF (jsPDF) no está disponible. Por favor, recargue la página.");
        return;
    }
    
    const contentContainer = document.createElement('div');
    contentContainer.style.position = 'fixed';
    contentContainer.style.left = '-9999px';
    const contentWidthMm = (orientation === 'landscape' ? 297 : 210) - 20; // Page width - 2*1cm margin
    contentContainer.style.width = `${contentWidthMm}mm`;
    contentContainer.style.backgroundColor = 'white';
    contentContainer.style.boxSizing = 'border-box';
    contentContainer.style.padding = '1px'; // Avoid margin collapse issues
    
    const styles = `
        #pdf-content { font-family: 'Helvetica', 'Arial', sans-serif; color: #374151; font-size: 10pt; }
        table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-wrap: break-word; }
        th { background-color: #f2f2f2; font-weight: bold; }
        h3 { font-size: 1.25rem; font-weight: bold; color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 5px; margin-bottom: 15px; }
        h4 { font-size: 1rem; font-weight: bold; color: #111827; margin-top: 15px; margin-bottom: 10px; }
        p { margin-bottom: 10px; line-height: 1.5; }
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
    `;
    
    contentContainer.innerHTML = `<style>${styles}</style><div id="pdf-content">${contentHtml}</div>`;
    document.body.appendChild(contentContainer);

    setTimeout(() => {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 10;
        const headerHeight = 25;
        const footerHeight = 15;

        pdf.html(contentContainer, {
            callback: async function (doc: any) {
                const teacherData = getStoredData<TeacherData>('teacher-app-data', { name: 'Profesor', email: '' });
                const instituteData = getStoredData<InstituteData>('institute-app-data', { name: 'Instituto', address: '', cif: '' });

                const totalPages = doc.internal.getNumberOfPages();
                
                for (let i = 1; i <= totalPages; i++) {
                    doc.setPage(i);
                    
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(20, 20, 20);
                    doc.text(title, pdfWidth / 2, 18, { align: 'center' });

                    doc.setDrawColor(229, 231, 235);
                    doc.line(margin, headerHeight - 5, pdfWidth - margin, headerHeight - 5);

                    const footerY = pdf.internal.pageSize.getHeight() - 8;
                    const dateText = new Date().toLocaleDateString();
                    const pageNumText = `Página ${i} de ${totalPages}`;
                    
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(120, 120, 120);

                    doc.text(`${instituteData.name} - ${teacherData.name}`, margin, footerY);
                    doc.text(pageNumText, pdfWidth / 2, footerY, { align: 'center' });
                    doc.text(dateText, pdfWidth - margin, footerY, { align: 'right' });
                    
                    doc.setDrawColor(229, 231, 235);
                    doc.line(margin, pdf.internal.pageSize.getHeight() - footerHeight + 2, pdfWidth - margin, pdf.internal.pageSize.getHeight() - footerHeight + 2);
                }
                
                doc.save(`${fileName}.pdf`);
                document.body.removeChild(contentContainer);
            },
            margin: [headerHeight, margin, footerHeight, margin],
            autoPaging: 'slice',
            width: pdfWidth - (margin * 2),
            windowWidth: contentContainer.scrollWidth,
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: true
            }
        });
    }, 100);
};

/**
 * Exports an array of data to an Excel file.
 * @param data The array of objects to export.
 * @param fileName The desired name for the output file (without extension).
 * @param sheetName The name for the sheet inside the Excel file.
 */
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