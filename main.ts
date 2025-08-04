import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod"

// 1. Crear el servidor
// Interfaz principal con el MCP. Se encarga de la comunicación entre el cliente y el servidor

const server = new McpServer({
  name: 'Demo',
  version: '1.0.0'
})

// 2. Definir las herramientas
// Las herramientas le permite al LLM realizar acciones a través de tu servidor.

server.tool(
  'fetch-weather',
  'aaaTool to fetch the weather of a city',
  {
    city: z.string().describe("City name")
  },
  async ({ city }) => {

    if (!city) return {
      content: [
        {
          type: 'text',
          text: 'No se ingresó una ciudad'
        }
      ]
    }

    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=es&format=json`)
    const data = await response.json()

    if (data.length == 0) {
      return {
        content: [
          {
            type: 'text',
            text: `No se encontró información para la ciudad ${city}`
          }
        ]
      }
    }

    const { latitude, longitude } = data?.results[0];

    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,precipitation,is_day,rain&forecast_days=1`)
    const weatherData = await weatherResponse.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weatherData, null, 2)
        }
      ]
    }
  }
)

// 3. Escuchar las conexiones del cliente

const transport = new StdioServerTransport()
console.log("=== MCP SERVER READY ===")
await server.connect(transport)
