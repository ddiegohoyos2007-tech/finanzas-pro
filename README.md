# FinanzasPro — Plantilla Web de Control Financiero Personal y Metas

Aplicación web moderna, rápida y 100% privada desarrollada con **React + Vite + Tailwind CSS**. Diseñada para que cualquier usuario gestione su efectivo, controle el límite de uso de su tarjeta de crédito y planifique metas de ahorro sin necesidad de servidores externos.

## Características principales
- **Onboarding rápido:** Configuración inicial en segundos (moneda personalizable, saldo base, ingresos periódicos y límite de tarjeta de crédito).
- **Creador de Metas Financieras:** Permite definir múltiples objetivos de ahorro, calcular automáticamente cuántas semanas faltan según el aporte semanal y registrar abonos parciales.
- **Control inteligente de Tarjeta de Crédito:** Barra de progreso de línea utilizada con alerta personalizable (ej. regla del 50%) y botón de liquidación rápida.
- **Privacidad Total (Local-First):** Todos los datos se guardan automáticamente en el navegador (`localStorage`) con opción de **Exportar e Importar respaldos en formato `.json`**.
- **Modo Demo incluido:** Un clic para poblar la interfaz con datos de ejemplo (ideal para presentaciones o pruebas).

---

## Instalación local (en 3 pasos)

1. Abre una terminal dentro de la carpeta del proyecto e instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
3. Abre el enlace que aparece en pantalla (normalmente `http://localhost:5173`).

---

## Despliegue gratuito en Vercel (en 2 minutos)

1. Sube esta carpeta a un repositorio nuevo en tu cuenta de **GitHub**.
2. Entra a [vercel.com](https://vercel.com), haz clic en **"Add New Project"** e importa tu repositorio.
3. Vercel detectará automáticamente que es un proyecto **Vite**. Haz clic en **Deploy** y obtendrás tu enlace público gratuito.

---

## Personalización rápida
- **Monedas:** Puedes añadir más divisas editando el arreglo `CURRENCIES` en `src/App.jsx`.
- **Categorías de gastos:** Edita las opciones del `<select>` en el formulario de movimientos dentro de `src/App.jsx`.
