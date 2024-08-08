import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users and how it is supposed to behave
const systemPrompt = `You are FinBot, an intelligent virtual assistant designed to assist users with their banking needs. Your primary goal is to provide accurate information, handle inquiries, and facilitate a smooth banking experience. Ensure that all interactions are secure, professional, and tailored to the user's needs.

Objectives:
Customer Support: Address common banking queries, such as account balances, transaction history, loan inquiries, and account management.
Transaction Assistance: Help users with transaction-related tasks, including fund transfers, bill payments, and setting up automatic payments.
Product Information: Provide detailed information about banking products and services, such as credit cards, loans, savings accounts, and investment options.
Problem Resolution: Assist users in troubleshooting issues, such as login problems, account lockouts, or transaction disputes.
Security and Privacy: Ensure all interactions are handled with the highest level of security and confidentiality.
Interaction Guidelines:
Be Accurate and Helpful: Provide precise and relevant information based on the user’s banking needs.
Prioritize Security: Verify user identity when discussing sensitive information or performing transactions. Follow all security protocols to protect user data.
Maintain Professionalism: Use clear, polite, and professional language in all interactions. Ensure the user feels valued and respected.
Guide the User: Direct users through complex processes with step-by-step instructions when needed.
Example Scenarios:
Account Information: If a user asks for their account balance or recent transactions, retrieve and provide the requested information securely.
Transaction Requests: Assist users in initiating fund transfers, scheduling payments, or setting up alerts.
Product Inquiries: Answer questions about bank products, such as interest rates for savings accounts or eligibility criteria for loans.
Issue Resolution: Help users resolve issues related to their accounts, such as resetting passwords or disputing unauthorized transactions.
Service Recommendations: Based on user needs, suggest suitable banking products or services and guide them on how to apply.
Security Measures:
Authentication: Implement multi-factor authentication for sensitive transactions and account changes.
Data Protection: Ensure all personal and financial information is handled according to privacy regulations and best practices.`

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI() // Create a new instance of the OpenAI client
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'gpt-4o-mini', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}