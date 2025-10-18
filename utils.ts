export const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
};

export const parseQuantity = (quantityStr: string): { value: number; unit: string } => {
    if (typeof quantityStr !== 'string') {
        const num = Number(quantityStr);
        return { value: isNaN(num) ? 0 : num, unit: 'unidad' };
    }
    const sanitizedStr = quantityStr.trim().toLowerCase();
    const match = sanitizedStr.match(/^(\d*[\.,]?\d+)\s*([a-zA-Z]+)/);
    
    if (match) {
        const value = parseFloat(match[1].replace(',', '.'));
        let unit = match[2].toLowerCase();

        // Normalize units
        if (unit === 'g' || unit === 'gr' || unit === 'gramo' || unit === 'gramos') unit = 'g';
        if (unit === 'kg' || unit === 'kilo' || unit === 'kilos') unit = 'kg';
        if (unit === 'l' || unit === 'litro' || unit === 'litros') unit = 'l';
        if (unit === 'ml' || unit === 'mililitro' || unit === 'mililitros') unit = 'ml';
        if (unit === 'u' || unit === 'ud' || unit === 'unidad' || unit === 'unidades') unit = 'unidad';

        return { value, unit };
    }

    const value = parseFloat(sanitizedStr);
    return { value: isNaN(value) ? 0 : value, unit: 'unidad' };
};
