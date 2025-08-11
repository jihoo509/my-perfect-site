// 현재 시간을 한국 시간(KST) 정보와 함께 반환하는 함수
export const getCurrentKoreanTimeInfo = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const kstOffset = 9 * 60 * 60000;
  const kstDate = new Date(utc + kstOffset);

  return {
    isoString: kstDate.toISOString(),
    localeString: kstDate.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    date: kstDate
  };
};

// 브라우저 임시 저장소에 데이터를 저장하는 함수
export const saveConsultationToStorage = (data: any) => {
  try {
    const existingData = JSON.parse(localStorage.getItem('consultationData') || '[]');
    const { isoString, localeString } = getCurrentKoreanTimeInfo();
    const newData = { 
      ...data, 
      id: Date.now(), 
      timestamp: isoString, // ISO 형식으로 저장
      timestamp_kst: localeString // 한국 시간 형식으로도 저장
    };
    existingData.push(newData);
    localStorage.setItem('consultationData', JSON.stringify(existingData));
    return newData;
  } catch (error) {
    console.error("로컬 스토리지에 저장 실패:", error);
    return null;
  }
};

// 저장된 모든 데이터를 불러오는 함수
export const loadConsultationsFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem('consultationData') || '[]');
  } catch (error) {
    console.error("로컬 스토리지에서 불러오기 실패:", error);
    return [];
  }
};

// 특정 데이터를 삭제하는 함수
export const removeConsultationFromStorage = (id: number) => {
  try {
    let existingData = loadConsultationsFromStorage();
    existingData = existingData.filter((item: any) => item.id !== id);
    localStorage.setItem('consultationData', JSON.stringify(existingData));
    return true;
  } catch (error) {
    console.error("로컬 스토리지에서 삭제 실패:", error);
    return false;
  }
};

// 모든 데이터를 삭제하는 함수
export const clearStorage = () => {
  try {
    localStorage.removeItem('consultationData');
    return true;
  } catch (error) {
    console.error("로컬 스토리지 초기화 실패:", error);
    return false;
  }
};

// 아래는 디버깅용 함수들이므로 실제 기능에는 영향 없음
export const debugKoreanTime = () => {
    console.log("현재 한국 시간 정보:", getCurrentKoreanTimeInfo());
};

export const compareTimeZones = () => {
    const localTime = new Date();
    const koreanTimeInfo = getCurrentKoreanTimeInfo();
    console.log("브라우저 시간:", localTime.toLocaleString());
    console.log("계산된 한국시간:", koreanTimeInfo.localeString);
};

export const testKoreanTime = () => {
    return "Test function executed";
};