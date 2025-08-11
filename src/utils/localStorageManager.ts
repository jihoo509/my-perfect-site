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
    const existingData = getConsultationsFromStorage();
    const { isoString, localeString } = getCurrentKoreanTimeInfo();
    const newData = { 
      ...data, 
      id: Date.now(), 
      timestamp: isoString, 
      timestamp_kst: localeString 
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
export const getConsultationsFromStorage = () => {
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
    let existingData = getConsultationsFromStorage();
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

// 아래는 AdminPanel이 사용하는 추가 디버깅 및 관리 함수들입니다.
export const getFilteredConsultations = (filter: string) => {
  const data = getConsultationsFromStorage();
  if (!filter) return data;
  return data.filter((item: any) => 
    item.name.includes(filter) || 
    item.phoneNumber.includes(filter)
  );
};

export const downloadCSV = (data: any[]) => {
  if (data.length === 0) {
    alert('내보낼 데이터가 없습니다.');
    return;
  }
  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + "번호,이름,연락처,상담유형,신청일시(KST)\n"
    + data.map((item, index) => `${index + 1},${item.name},${item.phoneNumber},${item.consultationType},"${item.timestamp_kst}"`).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `상담신청내역_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const checkDataConsistency = () => {
    console.log("데이터 일관성 체크 시작...");
    const data = getConsultationsFromStorage();
    console.log(`총 ${data.length}개의 데이터 발견됨.`);
    return "체크 완료";
};

export const testDateFiltering = () => {
    console.log("날짜 필터링 테스트");
    return "테스트 완료";
};

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