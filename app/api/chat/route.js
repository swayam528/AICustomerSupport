import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export async function POST(req) {
  try {
    const data = await req.json();

    const chatHistory = [
      {
        role: "system", 
        parts: [{ text: `You are FinBot, an intelligent virtual assistant designed to assist users with their banking needs. Your primary goal is to provide accurate information, handle inquiries, and facilitate a smooth banking experience. Ensure that all interactions are secure, professional, and tailored to the user's needs.

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
Data Protection: Ensure all personal and financial information is handled according to privacy regulations and best practices.` }],
      },
      ...data.map((message) => ({
        role: message.role === 'assistant' ? 'model' : message.role,
        parts: [{ text: message.content }],
      })),
    ];

    // Ensure the first message is from the user
    if (chatHistory[0].role !== 'user') {
      chatHistory.shift(); // Remove the system message if it's the first message
    }

    const chatSession = model.startChat({
      generationConfig,
      history: chatHistory,
    });

    const result = await chatSession.sendMessage(data[data.length - 1].content);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const text = result.response.text;
          const encodedText = encoder.encode(text);
          controller.enqueue(encodedText);
        } catch (error) {
          console.error('Error processing chat response:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error handling the request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
