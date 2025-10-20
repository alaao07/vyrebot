const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
    }
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask Vyre anything using AI')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('Your question')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('context')
                .setDescription('Additional context (optional)')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const question = interaction.options.getString('question');
            const context = interaction.options.getString('context') || '';
            
            const systemPrompt = `You are Vyre, an intelligent Discord bot assistant. You help users with:
- Academic questions with detailed explanations
- Technical/programming help with code examples
- Casual conversation in a friendly tone
- Mixed contexts by prioritizing the most important part

Analyze the user's question type and respond accordingly:
- Academic/Study: Detailed, structured explanations with examples
- Technical: Clear, accurate answers with code when needed
- Casual: Natural, conversational responses
- Mixed: Focus on the formal/technical parts but keep it clear

Keep responses concise but informative. Use formatting when helpful.`;

            const fullPrompt = context 
                ? `${systemPrompt}\n\nContext: ${context}\n\nQuestion: ${question}`
                : `${systemPrompt}\n\nQuestion: ${question}`;
            
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            const text = response.text();
            
            if (text.length > 2000) {
                const chunks = text.match(/[\s\S]{1,2000}/g) || [];
                await interaction.editReply(chunks[0]);
                
                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp(chunks[i]);
                }
            } else {
                await interaction.editReply(text);
            }
            
            console.log(`✅ AI response sent to ${interaction.user.tag}`);
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            await interaction.editReply({
                content: '❌ Sorry, I encountered an error processing your question. Please try again later.',
                ephemeral: true
            });
        }
    }
};