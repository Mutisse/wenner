import jsPDF from "jspdf";

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  color?: string;
  size?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  customer: {
    name: string;
    phone?: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod?: string;
  paymentDetails?: string;
  businessName?: string;
  businessAddress?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
}

// Função para converter hexadecimal para RGB
const hexToRgb = (hex: string): [number, number, number] | null => {
  // Remove o # se presente
  const cleanHex = hex.replace("#", "").trim();
  
  // Verifica se é um hex válido (3 ou 6 caracteres)
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return null;
  }
  
  let r: number, g: number, b: number;
  
  if (cleanHex.length === 3) {
    // Hex curto (ex: #f00)
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else {
    // Hex completo (ex: #ff0000)
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  
  return [r, g, b];
};

// Função para verificar se o endereço contém textos de placeholder
const isValidAddress = (address: string | undefined): boolean => {
  if (!address) return false;
  
  const placeholderTexts = [
    "Informe a rua e número",
    "Informe a cidade",
    "Informe o estado",
    "Informe o código de endereçamento postal",
  ];
  
  return !placeholderTexts.some((placeholder) => 
    address.includes(placeholder)
  );
};

export const generateInvoice = (data: InvoiceData) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;

  // Cores
  const primaryColor = [0, 0, 0]; // Preto
  const secondaryColor = [128, 128, 128]; // Cinza

  // Função para adicionar texto com estilo
  const addText = (
    text: string,
    x: number,
    y: number,
    fontSize: number,
    isBold: boolean = false,
    color: number[] = primaryColor,
    align?: "left" | "center" | "right"
  ) => {
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", isBold ? "bold" : "normal");
    pdf.setTextColor(color[0], color[1], color[2]);
    if (align) {
      pdf.text(text, x, y, { align });
    } else {
      pdf.text(text, x, y);
    }
  };

  // Função para adicionar linha horizontal
  const addLine = (y: number, width?: number) => {
    pdf.setDrawColor(200, 200, 200);
    const lineWidth = width || (pageWidth - 2 * margin);
    pdf.line(margin, y, margin + lineWidth, y);
  };

  // Função para adicionar linha mais grossa
  const addThickLine = (y: number, width?: number) => {
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    const lineWidth = width || (pageWidth - 2 * margin);
    pdf.line(margin, y, margin + lineWidth, y);
    pdf.setLineWidth(0.2); // Resetar para linha fina
  };

  // Função para desenhar um círculo colorido
  const addColorCircle = (x: number, y: number, radius: number, hexColor: string) => {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return; // Se não conseguir converter, não desenha
    
    const [r, g, b] = rgb;
    pdf.setFillColor(r, g, b);
    pdf.setDrawColor(200, 200, 200); // Borda cinza clara
    pdf.setLineWidth(0.1);
    pdf.circle(x, y, radius, "FD"); // F = fill, D = draw (borda)
  };

  // ========== HEADER ==========
  // Logo (círculo preto)
  pdf.setFillColor(0, 0, 0);
  pdf.circle(margin, margin + 8, 8, "F");

  // Título "FATURA" (estilizado, serif-like)
  addText("FATURA", margin + 20, margin + 12, 28, true);

  // Número da fatura e data (topo direito)
  const invoiceDate = data.date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  addText(`Fatura Nº ${data.invoiceNumber}`, pageWidth - margin, margin + 8, 10, false, primaryColor, "right");
  addText(invoiceDate, pageWidth - margin, margin + 15, 10, false, primaryColor, "right");

  yPosition = margin + 35;

  // ========== FATURADO PARA SECTION ==========
  addText("FATURADO PARA:", margin, yPosition, 10, true);
  yPosition += 7;
  addText(data.customer.name, margin, yPosition, 10);
  yPosition += 6;
  
  if (data.customer.phone) {
    addText(data.customer.phone, margin, yPosition, 10);
    yPosition += 6;
  }
  
  // Só mostrar endereço se for válido (não contém placeholders)
  if (data.customer.address && isValidAddress(data.customer.address)) {
    addText(data.customer.address, margin, yPosition, 10);
    yPosition += 6;
  }

  yPosition += 5;
  addLine(yPosition);
  yPosition += 10;

  // ========== ITEMS TABLE ==========
  // Cabeçalho da tabela
  const tableStartY = yPosition;
  const colWidths = {
    item: 80,
    quantity: 30,
    unitPrice: 35,
    total: 35,
  };
  const colPositions = {
    item: margin,
    quantity: margin + colWidths.item,
    unitPrice: margin + colWidths.item + colWidths.quantity,
    total: margin + colWidths.item + colWidths.quantity + colWidths.unitPrice,
  };

  // Cabeçalhos em negrito
  addText("Item", colPositions.item, yPosition, 10, true);
  addText("Quantidade", colPositions.quantity, yPosition, 10, true);
  addText("Preço Unit.", colPositions.unitPrice, yPosition, 10, true);
  addText("Total", colPositions.total, yPosition, 10, true);

  yPosition += 7;
  addLine(yPosition);

  // Itens da tabela
  data.items.forEach((item, index) => {
    yPosition += 7; // Espaçamento maior entre itens
    
    // Verificar se precisa de nova página
    if (yPosition > pageHeight - margin - 50) {
      pdf.addPage();
      yPosition = margin + 20;
      // Redesenhar cabeçalho da tabela se necessário
      addText("Item", colPositions.item, yPosition, 10, true);
      addText("Quantidade", colPositions.quantity, yPosition, 10, true);
      addText("Preço Unit.", colPositions.unitPrice, yPosition, 10, true);
      addText("Total", colPositions.total, yPosition, 10, true);
      yPosition += 7;
      addLine(yPosition);
      yPosition += 7;
    }

    // Nome do item (linha principal)
    const itemName = item.name;
    const baseY = yPosition; // Guardar posição Y base para alinhamento
    
    addText(itemName, colPositions.item, baseY, 9);
    
    // Linha de detalhes (cor e tamanho) abaixo do nome
    if (item.color || item.size) {
      const detailsY = baseY + 4.5; // Posição Y para os detalhes (espaçamento otimizado)
      let detailX = colPositions.item;
      
      // Desenhar círculo colorido se houver cor
      if (item.color) {
        const circleRadius = 2.2; // Raio do círculo em mm (ligeiramente menor para melhor proporção)
        const circleY = detailsY; // Posição Y do círculo (alinhado com o texto)
        addColorCircle(detailX, circleY, circleRadius, item.color);
        detailX += circleRadius * 2 + 4; // Espaço otimizado após o círculo
      }
      
      // Adicionar tamanho se houver
      if (item.size) {
        addText(`Tamanho: ${item.size}`, detailX, detailsY, 8, false, secondaryColor);
      }
    }
    
    // Quantidade, preço unitário e total (alinhados na mesma linha do nome do produto)
    // Centralizar verticalmente se houver detalhes
    const alignY = (item.color || item.size) ? baseY + 2 : baseY;
    addText(item.quantity.toString(), colPositions.quantity, alignY, 9);
    addText(`${item.unitPrice.toFixed(2)} MZN`, colPositions.unitPrice, alignY, 9);
    addText(`${item.total.toFixed(2)} MZN`, colPositions.total, alignY, 9);

    // Ajustar posição Y para próxima linha (considerar espaço dos detalhes se houver)
    if (item.color || item.size) {
      yPosition = baseY + 9; // Espaço otimizado quando há detalhes
    } else {
      yPosition = baseY + 5; // Espaço normal quando não há detalhes
    }
    
    // Linha separadora (mais sutil)
    addLine(yPosition, pageWidth - 2 * margin);
  });

  yPosition += 10;

  // ========== SUMMARY SECTION ==========
  // Verificar se precisa de nova página para o resumo
  if (yPosition > pageHeight - margin - 50) {
    pdf.addPage();
    yPosition = margin + 20;
  }

  const summaryStartX = pageWidth - margin - 80;
  const summaryLabelX = summaryStartX;
  const summaryValueX = pageWidth - margin;

  addText("Subtotal", summaryLabelX, yPosition, 10);
  addText(`${data.subtotal.toFixed(2)} MZN`, summaryValueX, yPosition, 10, false, primaryColor, "right");
  yPosition += 7;

  addText(`Imposto (0%)`, summaryLabelX, yPosition, 10);
  addText(`${data.tax.toFixed(2)} MZN`, summaryValueX, yPosition, 10, false, primaryColor, "right");
  yPosition += 7;

  addThickLine(yPosition);
  yPosition += 7;

  // Total a Pagar (em negrito e maior)
  addText("Total a Pagar", summaryLabelX, yPosition, 12, true);
  addText(`${data.total.toFixed(2)} MZN`, summaryValueX, yPosition, 14, true, primaryColor, "right");

  yPosition = pageHeight - margin - 50;

  // ========== FOOTER ==========
  // Mensagem de agradecimento
  addText("Obrigado pelo seu negócio!", margin, yPosition, 10, false, secondaryColor);
  yPosition += 10;

  // Informações de pagamento
  addText("INFORMAÇÕES DE PAGAMENTO", margin, yPosition, 10, true);
  yPosition += 7;

  // Método de pagamento e detalhes
  if (data.paymentMethod) {
    addText(data.paymentMethod, margin, yPosition, 9);
    yPosition += 6;
    
    if (data.paymentDetails) {
      addText(data.paymentDetails, margin, yPosition, 9, false, secondaryColor);
      yPosition += 6;
    }
  }

  // Dados bancários (se for transferência ou conta bancária)
  if (data.bankName) {
    addText(data.bankName, margin, yPosition, 9);
    yPosition += 6;
  }
  
  if (data.accountName) {
    addText(`Nome da Conta: ${data.accountName}`, margin, yPosition, 9);
    yPosition += 6;
  }
  
  if (data.accountNumber) {
    addText(`Nº da Conta: ${data.accountNumber}`, margin, yPosition, 9);
    yPosition += 6;
  }

  // Informações da empresa (canto direito)
  const businessY = pageHeight - margin - 50;
  if (data.businessName) {
    addText(data.businessName, pageWidth - margin, businessY, 12, true, primaryColor, "right");
  }
  if (data.businessAddress) {
    addText(data.businessAddress, pageWidth - margin, businessY + 7, 9, false, secondaryColor, "right");
  }

  // Salvar o PDF
  const fileName = `fatura-${data.invoiceNumber}-${new Date().toISOString().split("T")[0]}.pdf`;
  pdf.save(fileName);
};

