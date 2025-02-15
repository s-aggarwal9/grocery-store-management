import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export async function generatePDF(elementId: string, filename: string) {
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error("Element not found");

    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false
    });

    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw error;
  }
}
