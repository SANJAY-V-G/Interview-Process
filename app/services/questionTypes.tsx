// src/services/questionTypes.ts
import axios from 'axios';

const API_BASE_URL = 'https://backend-nox2.onrender.com';

export const fetchQuestionTypes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/constants/question-types`);
    console.log('Fetched question types:', response.data); // Debugging line
    return response.data;
  } catch (error) {
    console.error('Error fetching question types:', error);
    return [];
  }
};

export const addQuestionType = async (newType: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/question-types`, {
      new_type: newType.trim()
    });
    return response.data;
  } catch (error) {
    console.error('Error adding question type:', error);
    throw error;
  }
};