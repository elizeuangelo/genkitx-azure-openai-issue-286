import { config } from 'dotenv';
import { genkit, z } from 'genkit';
import { openAI, gpt4o } from 'genkitx-openai';

config();
// Load environment variables from .env file

export const ai = genkit({
	plugins: [
		openAI({
			apiKey: process.env.OPENAI_API_KEY,
		}),
	],
	model: gpt4o.withVersion('2024-11-20'),
});

const getWeather = ai.defineTool(
	{
		name: 'getWeather',
		description: 'Gets the current weather in a given location',
		inputSchema: z.object({
			location: z.string().describe('The location to get the current weather for'),
		}),
		outputSchema: z.object({
			temperature: z.number().describe('The current temperature in degrees Fahrenheit'),
			condition: z.enum(['sunny', 'cloudy', 'rainy', 'snowy']).describe('The current weather condition'),
		}),
	},
	async ({ location }) => {
		// Fake weather data
		const randomTemp = Math.floor(Math.random() * 30) + 50; // Random temp between 50 and 80
		const conditions = ['sunny', 'cloudy', 'rainy', 'snowy'];
		const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

		return { location, temperature: randomTemp, condition: randomCondition };
	}
);

const testStreamingFlow = ai.defineFlow(
	{
		name: 'testStreamingFlow',
		inputSchema: z.string(),
		streamSchema: z.string(),
		outputSchema: z.string(),
	},
	async (prompt, { sendChunk }) => {
		const response = ai.generateStream({
			model: gpt4o,
			prompt,
			tools: [getWeather],
		});

		for await (const chunk of response.stream) {
			// Here, you could process the chunk in some way before sending it to
			// the output stream via streamingCallback(). In this example, we output
			// the text of the chunk, unmodified.
			sendChunk(chunk.text);
		}

		return (await response.response).text;
	}
);

const response = await testStreamingFlow('What is the weather like in Seattle?', {
	onChunk: (chunk) => {
		console.log('Chunk:', chunk);
	},
});

console.log('Final response:', response);
