import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class VideoService {
  constructor() {
    this.agoraAppId = process.env.AGORA_APP_ID;
    this.agoraAppCertificate = process.env.AGORA_APP_CERTIFICATE;
    this.mockMode = !this.agoraAppId || this.agoraAppId.includes('your-');
  }

  /**
   * Generate Agora RTC token for video call
   */
  async generateToken(channelName, uid, role = 'publisher') {
    if (this.mockMode) {
      return this._mockGenerateToken(channelName, uid, role);
    }

    try {
      // In production, you would use Agora's token generation
      // For now, using mock implementation
      const token = `agora_token_${channelName}_${uid}_${Date.now()}`;
      
      return {
        success: true,
        token,
        channelName,
        uid,
        appId: this.agoraAppId,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      };
    } catch (error) {
      console.error('Agora token generation error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Start video consultation
   */
  async startConsultation(bookingId, doctorId, patientId) {
    const channelName = `consultation_${bookingId}`;
    
    // Generate tokens for both doctor and patient
    const doctorToken = await this.generateToken(channelName, `doctor_${doctorId}`, 'publisher');
    const patientToken = await this.generateToken(channelName, `patient_${patientId}`, 'publisher');

    if (!doctorToken.success || !patientToken.success) {
      return {
        success: false,
        error: 'Failed to generate video tokens',
      };
    }

    return {
      success: true,
      consultation: {
        channelName,
        bookingId,
        doctorToken: doctorToken.token,
        patientToken: patientToken.token,
        appId: this.agoraAppId || 'mock_app_id',
        startedAt: new Date().toISOString(),
        mockMode: this.mockMode,
      },
    };
  }

  /**
   * End video consultation
   */
  async endConsultation(channelName) {
    if (this.mockMode) {
      return this._mockEndConsultation(channelName);
    }

    try {
      // In production, you might want to:
      // - Stop recording
      // - Calculate duration
      // - Update consultation status
      
      return {
        success: true,
        endedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('End consultation error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get consultation recording (if enabled)
   */
  async getRecording(channelName) {
    if (this.mockMode) {
      return {
        success: true,
        recording: null,
        message: 'Recording not available in mock mode',
        mockMode: true,
      };
    }

    // In production, fetch recording from Agora cloud recording
    return {
      success: true,
      recording: null,
      message: 'Recording feature not yet implemented',
    };
  }

  // Mock implementations
  _mockGenerateToken(channelName, uid, role) {
    console.log(`📹 [MOCK] Generating video token for channel: ${channelName}, uid: ${uid}`);
    
    return {
      success: true,
      token: `mock_token_${channelName}_${uid}_${Date.now()}`,
      channelName,
      uid,
      appId: 'mock_app_id',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      mockMode: true,
    };
  }

  _mockEndConsultation(channelName) {
    console.log(`📹 [MOCK] Ending consultation: ${channelName}`);
    
    return {
      success: true,
      endedAt: new Date().toISOString(),
      duration: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
      mockMode: true,
    };
  }
}

export default new VideoService();
