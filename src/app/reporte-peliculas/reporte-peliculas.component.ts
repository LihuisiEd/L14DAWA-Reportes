import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css']
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  peliculasFiltradas: any[] = [];
  generos: string[] = [];
  anios: number[] = [];
  filtroGenero: string = '';
  filtroAnio: number = 0;

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe(data => {
      this.peliculas = data;
      this.peliculasFiltradas = data;
      this.generos = this.obtenerGenerosUnicos();
      this.anios = this.obtenerAniosUnicos();
    });
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'encabezado' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            [
              { text: 'Título', style: 'encabezadoTabla' },
              { text: 'Género', style: 'encabezadoTabla' },
              { text: 'Año de lanzamiento', style: 'encabezadoTabla' }
            ],
            ...this.peliculasFiltradas.map(pelicula => [
              { text: pelicula.titulo, style: 'celdaTabla' },
              { text: pelicula.genero, style: 'celdaTabla' },
              { text: pelicula.lanzamiento.toString(), style: 'celdaTabla' }
            ])
          ]
        }
      }
    ];

    const estilos = {
      encabezado: {
        fontSize: 18,
        bold: true
      },
      encabezadoTabla: {
        fillColor: '#337ab7',
        color: '#ffffff',
        bold: true
      },
      celdaTabla: {
        fillColor: '#f5f5f5'
      },
      tabla: {
        color: '#ffffff'
      }
    };

    const documentDefinition = {
      content: contenido,
      styles: estilos
    };

    pdfMake.createPdf(documentDefinition).open();
  }

  filtrarPeliculas() {
    this.peliculasFiltradas = this.peliculas.filter(pelicula => {
      if (this.filtroGenero && pelicula.genero !== this.filtroGenero) {
        return false;
      }
  
      if (this.filtroAnio !== 0 && pelicula.lanzamiento != this.filtroAnio) {
        return false;
      }
  
      return true;
    });
  }

  exportarExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.peliculasFiltradas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Peliculas');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(blob, 'peliculas.xlsx');
  }

  exportarCSV() {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Título,Género,Año de lanzamiento\n';

    this.peliculasFiltradas.forEach(pelicula => {
      csvContent += `${pelicula.titulo},${pelicula.genero},${pelicula.lanzamiento}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'peliculas.csv');
    document.body.appendChild(link);
    link.click();
  }

  private obtenerGenerosUnicos(): string[] {
    const generosSet = new Set<string>();
    this.peliculas.forEach(pelicula => generosSet.add(pelicula.genero));
    return Array.from(generosSet);
  }

  private obtenerAniosUnicos(): number[] {
    const aniosSet = new Set<number>();
    this.peliculas.forEach(pelicula => aniosSet.add(pelicula.lanzamiento));
    return Array.from(aniosSet);
  }
}
