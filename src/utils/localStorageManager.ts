// 브라우저 임시 저장소에 데이터를 저장하는 함수
export const saveConsultationToStorage = (data: any) => {
  try {
    const existingData = JSON.parse(localStorage.getItem('consultationData') || '[]');
    const newData = { ...data, id: Date.now(), timestamp: new Date().toISOString() };
    existingData.push(newData);
    localStorage.setItem('consultationData', JSON.stringify(existingData));
    return newData;
  } catch (error) {
    console.error("로컬 스토리지에 저장 실패:", error);
    return null;
  }
};