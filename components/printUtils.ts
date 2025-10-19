import { TeacherData, InstituteData } from './types';

// Helper to fetch data safely from localStorage
const getStoredData = <T,>(key: string, defaultValue: T): T => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

/**
 * Generates and prints an HTML content string with a standardized header and footer.
 * @param title The title of the document.
 * @param contentHtml The HTML string of the content to be printed.
 */
export const printContent = (title: string, contentHtml: string) => {
    const teacherData = getStoredData<TeacherData>('teacher-app-data', { name: 'Profesor', email: '' });
    const instituteData = getStoredData<InstituteData>('institute-app-data', { name: 'Instituto', address: '', cif: '' });

    const printWindow = window.open('', '_blank', 'height=800,width=1000');
    if (!printWindow) {
        alert("No se pudo abrir la ventana de impresión. Por favor, deshabilita el bloqueador de pop-ups.");
        return;
    }

    const headerHtml = `
        <div id="print-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 2px solid #e5e7eb; margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                ${instituteData.logo ? `<img src="${instituteData.logo}" alt="Logo Instituto" style="height: 50px; max-width: 150px; object-fit: contain;">` : ''}
                <div>
                    <h2 style="font-weight: bold; font-size: 1.125rem; color: #1f2937;">${instituteData.name}</h2>
                </div>
            </div>
            <div style="text-align: right; display: flex; align-items: center; gap: 1rem;">
                 <div>
                    <h3 style="font-weight: bold; font-size: 1.125rem; color: #1f2937;">${teacherData.name}</h3>
                </div>
                ${teacherData.logo ? `<img src="${teacherData.logo}" alt="Logo Profesor" style="height: 50px; max-width: 150px; object-fit: contain;">` : ''}
            </div>
        </div>
        <h1 style="font-size: 1.875rem; font-weight: bold; text-align: center; margin-bottom: 2rem; color: #11182c;">${title}</h1>
    `;
    
    const footerHtml = `
        <div id="print-footer" style="font-size: 0.75rem; color: #6b7280; text-align: center;">
            <p>${teacherData.name}</p>
        </div>
        <div id="page-number"></div>
    `;

    const styles = `
        @import url('https://rsms.me/inter/inter.css');
        body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 1.5rem;
            -webkit-print-color-adjust: exact;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.8rem;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f9fafb;
            font-weight: 600;
        }
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        @page {
            size: A4;
            margin: 1.5cm;
            @bottom-center {
                content: element(footer);
            }
        }
        #print-header, #print-footer {
            width: 100%;
            box-sizing: border-box;
        }
        #print-footer {
            position: running(footer);
        }
        #page-number::after {
            content: "Página " counter(page);
        }
        .print-container {
            counter-reset: page 1;
        }
        .break-inside-avoid {
            break-inside: avoid;
        }
    `;

    printWindow.document.write(`
        <html>
            <head>
                <title>${title}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>${styles}</style>
            </head>
            <body class="print-container">
                ${headerHtml}
                <div id="print-content">${contentHtml}</div>
                ${footerHtml}
                <script>
                    setTimeout(() => {
                        window.print();
                        window.close();
                    }, 250);
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
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
