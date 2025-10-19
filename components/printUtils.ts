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
 * Generates and downloads a PDF file from an HTML content string.
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

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.width = orientation === 'landscape' ? '297mm' : '210mm';
    container.style.padding = '10mm';
    container.style.boxSizing = 'border-box';
    container.style.backgroundColor = 'white';
    
    document.body.appendChild(container);

    const teacherData = getStoredData<TeacherData>('teacher-app-data', { name: 'Profesor', email: '' });
    const instituteData = getStoredData<InstituteData>('institute-app-data', { name: 'Instituto', address: '', cif: '' });

    let headerHtml = '';

    if (minimalHeader) {
        headerHtml = `
            <div id="pdf-header">
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.25rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${instituteData.logo ? `<img src="${instituteData.logo}" alt="Logo Instituto" style="height: 20px; max-width: 100px; object-fit: contain;">` : ''}
                        <div>
                            <h2 style="font-weight: bold; font-size: 0.7rem; color: #1f2937; margin:0;">${instituteData.name}</h2>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; align-items: center; gap: 0.5rem;">
                         <div>
                            <h3 style="font-weight: bold; font-size: 0.7rem; color: #1f2937; margin:0;">${teacherData.name}</h3>
                        </div>
                        ${teacherData.logo ? `<img src="${teacherData.logo}" alt="Logo Profesor" style="height: 20px; max-width: 100px; object-fit: contain;">` : ''}
                    </div>
                </div>
                <h1 style="font-size: 1rem; font-weight: bold; text-align: center; margin-bottom: 0.5rem; color: #11182c;">${title}</h1>
            </div>
        `;
    } else {
         headerHtml = `
            <div id="pdf-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 2px solid #e5e7eb; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    ${instituteData.logo ? `<img src="${instituteData.logo}" alt="Logo Instituto" style="height: 30px; max-width: 150px; object-fit: contain;">` : ''}
                    <div>
                        <h2 style="font-weight: bold; font-size: 1rem; color: #1f2937; margin:0;">${instituteData.name}</h2>
                    </div>
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 1rem;">
                     <div>
                        <h3 style="font-weight: bold; font-size: 1rem; color: #1f2937; margin:0;">${teacherData.name}</h3>
                    </div>
                    ${teacherData.logo ? `<img src="${teacherData.logo}" alt="Logo Profesor" style="height: 30px; max-width: 150px; object-fit: contain;">` : ''}
                </div>
            </div>
            <h1 style="font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 1rem; color: #11182c;">${title}</h1>
        `;
    }

    const styles = `
        @import url('https://rsms.me/inter/inter.css');
        body { font-family: 'Inter', sans-serif; color: #374151; }
        table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
    `;

    container.innerHTML = `
        <style>${styles}</style>
        ${headerHtml}
        <div id="pdf-content">${contentHtml}</div>
    `;

    html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true
    }).then((canvas: { toDataURL: (arg0: string) => any; width: number; height: number; }) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasHeight / canvasWidth;
        const imgHeight = pdfWidth * ratio;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = -heightLeft;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${fileName}.pdf`);
        document.body.removeChild(container);
    }).catch((err: any) => {
        console.error("Error generating PDF:", err);
        alert("Hubo un error al generar el PDF.");
        document.body.removeChild(container);
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
