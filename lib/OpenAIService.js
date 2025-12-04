/**
 * OpenAI Service
 * Handles transcription and media interpretation using OpenAI API
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;

    if (!this.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY not configured');
    }

    this.client = new OpenAI({
      apiKey: this.apiKey
    });
  }

  /**
   * Transcribe audio using OpenAI Whisper
   * @param {string} audioFilePath - Full path to audio file
   * @param {string} language - Language code (e.g., 'pt', 'en') - optional
   * @returns {Promise<object>} { text, language, duration }
   */
  async transcribeAudio(audioFilePath, language = 'pt') {
    try {
      console.log(`🎤 Transcribing audio: ${audioFilePath}`);

      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      // PROFESSIONAL FIX: Validate file size (prevent corrupted files)
      const stats = fs.statSync(audioFilePath);
      if (stats.size < 100) {
        throw new Error(`Audio file too small (${stats.size} bytes), likely corrupted`);
      }

      // Get file extension
      const ext = path.extname(audioFilePath).toLowerCase();

      // If OGG, we need to convert to MP3 first
      // For now, we'll try to transcribe directly
      // OpenAI Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
      const supportedFormats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];

      let fileToTranscribe = audioFilePath;

      if (!supportedFormats.includes(ext)) {
        console.warn(`⚠️ Audio format ${ext} not directly supported. Attempting transcription anyway...`);
        // In production, you should convert OGG to MP3 using ffmpeg here
      }

      // PROFESSIONAL FIX: Try OGG fallback if MP3 fails
      let transcription;
      try {
        // Create a readable stream
        const audioStream = fs.createReadStream(fileToTranscribe);

        // Call OpenAI Whisper API
        transcription = await this.client.audio.transcriptions.create({
          file: audioStream,
          model: 'whisper-1',
          language: language, // Optional: helps with accuracy
          response_format: 'verbose_json' // Get detailed response with language detection
        });
      } catch (openaiError) {
        // If MP3 failed and we have an OGG version, try that
        const oggPath = audioFilePath.replace(/\.(mp3|mp4|mpeg)$/, '.ogg');
        if (fs.existsSync(oggPath) && oggPath !== audioFilePath) {
          console.warn(`⚠️ MP3 transcription failed, trying OGG fallback: ${oggPath}`);
          const oggStream = fs.createReadStream(oggPath);
          transcription = await this.client.audio.transcriptions.create({
            file: oggStream,
            model: 'whisper-1',
            language: language,
            response_format: 'verbose_json'
          });
        } else {
          throw openaiError; // No fallback available, re-throw
        }
      }

      console.log(`✅ Audio transcribed successfully (${transcription.duration}s)`);

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        segments: transcription.segments || []
      };

    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Analyze and interpret image using OpenAI Vision
   * @param {string} imageUrl - Public URL to image
   * @param {string} prompt - Custom prompt for analysis
   * @returns {Promise<object>} { interpretation, details }
   */
  async analyzeImage(imageUrl, prompt = null) {
    try {
      console.log(`🖼️ Analyzing image: ${imageUrl}`);

      const defaultPrompt = 'Descreva esta imagem em detalhes, incluindo objetos, pessoas, texto visível, contexto e qualquer informação relevante.';

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o', // GPT-4 Turbo with Vision
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt || defaultPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const interpretation = response.choices[0].message.content;

      console.log(`✅ Image analyzed successfully`);

      return {
        interpretation,
        model: response.model,
        usage: response.usage
      };

    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      throw error;
    }
  }

  /**
   * Extract text from document/image using OCR-like capabilities
   * @param {string} imageUrl - Public URL to document image
   * @returns {Promise<object>} { extractedText }
   */
  async extractTextFromDocument(imageUrl) {
    try {
      console.log(`📄 Extracting text from document: ${imageUrl}`);

      const prompt = 'Extraia todo o texto visível neste documento. Retorne apenas o texto extraído, mantendo a formatação original quando possível.';

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const extractedText = response.choices[0].message.content;

      console.log(`✅ Text extracted successfully`);

      return {
        extractedText,
        model: response.model
      };

    } catch (error) {
      console.error('❌ Error extracting text from document:', error);
      throw error;
    }
  }

  /**
   * Get AI interpretation of media content
   * Routes to appropriate method based on media type
   * @param {string} mediaType - audio, image, video, document
   * @param {string} mediaUrl - Public URL or file path
   * @param {string} localPath - Local file path (for audio)
   * @returns {Promise<object>} { interpretation, transcription }
   */
  async interpretMedia(mediaType, mediaUrl, localPath = null) {
    try {
      console.log(`🤖 Interpreting ${mediaType} media`);

      switch (mediaType) {
        case 'audio': {
          if (!localPath) {
            throw new Error('Local path required for audio transcription');
          }
          const fullPath = path.join(process.cwd(), 'public', localPath);
          const transcription = await this.transcribeAudio(fullPath);

          return {
            transcription: transcription.text,
            interpretation: `Áudio transcrito com ${transcription.duration}s de duração`,
            language: transcription.language,
            metadata: {
              duration: transcription.duration,
              segments: transcription.segments
            }
          };
        }

        case 'image': {
          const analysis = await this.analyzeImage(mediaUrl);
          return {
            interpretation: analysis.interpretation,
            transcription: null,
            metadata: {
              model: analysis.model,
              usage: analysis.usage
            }
          };
        }

        case 'document': {
          // Try to extract text first
          const extraction = await this.extractTextFromDocument(mediaUrl);

          // Then get interpretation
          const prompt = `Analise este documento e forneça um resumo do conteúdo:\n\n${extraction.extractedText}`;

          const interpretation = await this.client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 300
          });

          return {
            transcription: extraction.extractedText,
            interpretation: interpretation.choices[0].message.content,
            metadata: {
              model: interpretation.model
            }
          };
        }

        case 'video': {
          // For video, we can't directly process
          // In future, you could extract frames and analyze those
          return {
            interpretation: 'Vídeo recebido (processamento de vídeo não implementado)',
            transcription: null,
            metadata: {}
          };
        }

        default:
          return {
            interpretation: `Mídia do tipo ${mediaType} recebida`,
            transcription: null,
            metadata: {}
          };
      }

    } catch (error) {
      console.error('❌ Error interpreting media:', error);
      throw error;
    }
  }

  /**
   * Check if OpenAI API is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

// Export singleton instance
const openAIService = new OpenAIService();
export default openAIService;
