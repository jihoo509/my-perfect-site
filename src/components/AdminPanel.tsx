import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Download, RefreshCw, Phone, Monitor, CheckSquare, Square, Trash2, Database, Copy, CalendarIcon, Wifi, WifiOff, AlertCircle, Clock, TestTube, Filter, Search } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  getConsultationsFromStorage, 
  getFilteredConsultations, 
  downloadCSV, 
  updateConsultationStatus,
  generateDemoData,
  clearStorage,
  debugKoreanTime,
  getCurrentKoreanTimeInfo,
  compareTimeZones,
  testKoreanTime,
  testDateFiltering,
  checkDataConsistency
} from '../utils/localStorageManager';

interface ConsultationData {
  id: string;
  name: string;
  gender: string;
  phoneNumber: string;
  birthDate: string;
  consultationType: 'phone' | 'online';
  consultationTypeKorean: string;
  status: string;
  statusKorean: string;
  submittedAt: string;
  submittedAtFormatted: string;
  updatedAt?: string;
}

export function AdminPanel() {
  const [consultations, setConsultations] = useState<ConsultationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'phone' | 'online'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [currentKoreanTime, setCurrentKoreanTime] = useState<string>('');
  
  // 날짜 선택 상태 - 한국 시간 기준으로 기본값 설정
  const getKoreanToday = (): Date => {
    const timeInfo = getCurrentKoreanTimeInfo();
    return new Date(timeInfo.dateString + 'T00:00:00.000Z'); // 한국 날짜를 UTC 자정으로 설정
  };
  
  const [startDate, setStartDate] = useState<Date>(getKoreanToday());
  const [endDate, setEndDate] = useState<Date>(getKoreanToday());
  const [dateFilterEnabled, setDateFilterEnabled] = useState(false);

  // 현재 한국 시간 실시간 업데이트
  useEffect(() => {
    const updateTime = () => {
      const timeInfo = getCurrentKoreanTimeInfo();
      setCurrentKoreanTime(timeInfo.formatted);
    };
    
    updateTime(); // 초기 설정
    const interval = setInterval(updateTime, 1000); // 1초마다 업데이트
    
    return () => clearInterval(interval);
  }, []);

  // 한국 시간대 기준 날짜 포맷팅 함수
  const formatKoreanDate = (date: Date) => {
    // UTC 날짜를 한국 시간대로 해석하여 포맷팅
    const utcDate = new Date(date.getTime());
    const year = utcDate.getUTCFullYear();
    const month = utcDate.getUTCMonth() + 1;
    const day = utcDate.getUTCDate();
    
    return `${year}년 ${month}월 ${day}일 (KST)`;
  };

  // 로컬 스토리지 상태 확인 함수 - 향상된 버전
  const checkLocalStorageStatus = () => {
    try {
      const storageData = localStorage.getItem('dental_insurance_consultations');
      const allData = getConsultationsFromStorage();
      const timeInfo = getCurrentKoreanTimeInfo();
      
      let debugMsg = `🔍 로컬 스토리지 상태 확인 (${timeInfo.formatted}):\n`;
      debugMsg += `• 저장된 원시 데이터: ${storageData ? '존재' : '없음'}\n`;
      debugMsg += `• 파싱된 데이터 개수: ${allData.length}건\n`;
      debugMsg += `• 현재 한국 날짜: ${timeInfo.dateString}\n`;
      
      if (allData.length > 0) {
        debugMsg += `• 최신 데이터: ${allData[0].name} (${allData[0].consultationTypeKorean})\n`;
        debugMsg += `• 최신 신청시간: ${allData[0].submittedAtFormatted}\n`;
        debugMsg += `• 전화상담: ${allData.filter(d => d.consultationType === 'phone').length}건\n`;
        debugMsg += `• 온라인분석: ${allData.filter(d => d.consultationType === 'online').length}건\n`;
        
        // 각 데이터의 날짜 정보 표시
        debugMsg += `• 저장된 데이터 날짜들:\n`;
        allData.slice(0, 5).forEach(data => {
          debugMsg += `  - ${data.name}: ${data.submittedAt} (포맷: ${data.submittedAtFormatted})\n`;
        });
        
        // 시간대 정보 분석
        const hasKSTInfo = allData.filter(d => d.submittedAt.includes('+09:00')).length;
        const hasUTCInfo = allData.filter(d => d.submittedAt.includes('Z') && !d.submittedAt.includes('+09:00')).length;
        debugMsg += `• 시간대 정보:\n`;
        debugMsg += `  - 한국 시간대(+09:00) 포함: ${hasKSTInfo}건\n`;
        debugMsg += `  - UTC(Z) 포함: ${hasUTCInfo}건\n`;
      }
      
      setDebugInfo(debugMsg);
      console.log(debugMsg);
      
      // 추가 디버그 정보 출력
      debugKoreanTime();
      checkDataConsistency();
      
      return allData;
    } catch (error) {
      const errorMsg = `❌ 로컬 스토리지 읽기 오류: ${error.message}`;
      setDebugInfo(errorMsg);
      console.error(errorMsg);
      return [];
    }
  };

  // 날짜 필터링 테스트 함수 - 향상된 버전
  const performDateFilterTest = () => {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log('=== 날짜 필터링 테스트 시작 ===');
    console.log('📅 브라우저 시간대:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('📅 브라우저 현재 시간:', new Date().toString());
    console.log('📅 선택된 필터 범위:', startDateStr, '~', endDateStr);
    
    // 데이터 일관성 체크 먼저 실행
    checkDataConsistency();
    
    // 날짜 필터링 테스트 실행
    testDateFiltering(startDateStr, endDateStr);
    
    const timeInfo = getCurrentKoreanTimeInfo();
    const comparison = compareTimeZones();
    
    alert(
      `📅 날짜 필터링 테스트 결과\n\n` +
      `필터 범위: ${startDateStr} ~ ${endDateStr}\n` +
      `현재 한국 날짜: ${timeInfo.dateString}\n` +
      `브라우저 시간대: ${Intl.DateTimeFormat().resolvedOptions().timeZone}\n` +
      `UTC와 한국 시간 차이: ${comparison.difference.fromUTC.hours.toFixed(1)}시간\n\n` +
      `⚠️ 중요: 8월 1일 데이터가 8월 3일에서 찾아진다면\n` +
      `시간대 변환에서 2일의 오차가 발생하고 있습니다.\n\n` +
      `자세한 테스트 결과는 콘솔을 확인하세요.`
    );
  };

  // 시간대 테스트 함수 - 향상된 버전
  const performTimeTest = () => {
    console.log('=== 시간대 종합 테스트 ===');
    
    testKoreanTime();
    const timeComparison = compareTimeZones();
    
    // 브라우저 시간대 정보
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const browserOffset = new Date().getTimezoneOffset();
    
    console.log('🌐 브라우저 환경 정보:');
    console.log('  - 시간대:', browserTimeZone);
    console.log('  - UTC 오프셋:', browserOffset, '분');
    console.log('  - 현재 시간:', new Date().toString());
    
    const timeInfo = getCurrentKoreanTimeInfo();
    alert(
      `🕐 한국 시간 테스트 결과\n\n` +
      `현재 한국 시간: ${timeInfo.formatted}\n` +
      `한국 날짜: ${timeInfo.dateString}\n` +
      `UTC 시간과의 차이: ${timeComparison.difference.fromUTC.hours.toFixed(1)}시간\n` +
      `브라우저와의 차이: ${timeComparison.difference.fromBrowser.hours.toFixed(1)}시간\n\n` +
      `브라우저 시간대: ${browserTimeZone}\n` +
      `브라우저 UTC 오프셋: ${browserOffset}분\n\n` +
      `📝 콘솔에서 자세한 테스트 결과를 확인하세요.`
    );
  };

  // 데이터 일관성 체크 버튼 함수
  const performDataConsistencyCheck = () => {
    console.log('=== 데이터 일관성 체크 실행 ===');
    checkDataConsistency();
    
    const consultations = getConsultationsFromStorage();
    if (consultations.length === 0) {
      alert('체크할 데이터가 없습니다.\n먼저 테스트 데이터를 추가해주세요.');
      return;
    }
    
    const hasKSTInfo = consultations.filter(d => d.submittedAt.includes('+09:00')).length;
    const hasUTCInfo = consultations.filter(d => d.submittedAt.includes('Z') && !d.submittedAt.includes('+09:00')).length;
    
    alert(
      `📊 데이터 일관성 체크 결과\n\n` +
      `총 데이터: ${consultations.length}건\n` +
      `한국 시간대(+09:00): ${hasKSTInfo}건\n` +
      `UTC 시간(Z): ${hasUTCInfo}건\n\n` +
      `${hasKSTInfo > 0 && hasUTCInfo > 0 ? 
        '⚠️ 시간대 정보가 혼재되어 있습니다.' : 
        '✅ 시간대 정보가 일관됩니다.'}\n\n` +
      `콘솔에서 각 데이터의 상세 정보를 확인하세요.`
    );
  };

  // 서버 연결 상태 확인
  const checkServerStatus = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-5cb829a8/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(3000)
      });

      if (response.ok) {
        setIsOnlineMode(true);
        console.log('🌐 관리자 패널 - 온라인 모드');
        return true;
      } else {
        setIsOnlineMode(false);
        console.log('💾 관리자 패널 - 오프라인 모드');
        return false;
      }
    } catch (error) {
      setIsOnlineMode(false);
      console.log('💾 관리자 패널 - 오프라인 모드 (서버 연결 불가)');
      return false;
    }
  };

  // 오프라인 모드에서 데이터 로드 - 개선된 버전
  const loadOfflineConsultations = () => {
    setLoading(true);
    try {
      console.log('=== 오프라인 데이터 로드 시작 ===');
      console.log(`필터: ${filter}`);
      console.log(`날짜 필터 활성화: ${dateFilterEnabled}`);
      
      const timeInfo = getCurrentKoreanTimeInfo();
      console.log(`현재 한국 시간: ${timeInfo.formatted}`);
      console.log(`현재 한국 날짜: ${timeInfo.dateString}`);
      
      // 먼저 로컬 스토리지 상태 확인
      const allStorageData = checkLocalStorageStatus();
      
      // 날짜 필터 데이터 준비
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;
      
      if (dateFilterEnabled && startDate && endDate) {
        // 선택된 날짜를 한국 시간대 기준으로 변환
        startDateStr = startDate.toISOString().split('T')[0];
        endDateStr = endDate.toISOString().split('T')[0];
        console.log('📅 날짜 필터 적용 (한국 시간 기준):', startDateStr, '~', endDateStr);
        console.log('📅 선택된 날짜 (UTC 기준):', startDate.toISOString(), '~', endDate.toISOString());
        console.log('🇰🇷 한국 시간대 표시:', formatKoreanDate(startDate), '~', formatKoreanDate(endDate));
      } else {
        console.log('⏭️ 날짜 필터 비활성화');
      }

      // 데이터 필터링
      const data = getFilteredConsultations(filter, startDateStr, endDateStr);
      
      console.log(`📊 필터링 후 데이터: ${data.length}건`);
      console.log('📋 불러온 데이터:', data);
      
      setConsultations(data);
      
      let statusMsg = `✅ 오프라인 모드에서 ${data.length}건의 상담 데이터 로드 완료 (${timeInfo.formatted})`;
      if (allStorageData.length !== data.length) {
        statusMsg += ` (전체 ${allStorageData.length}건 중 필터링)`;
      }
      
      if (dateFilterEnabled) {
        statusMsg += `\n📅 날짜 필터: ${startDateStr} ~ ${endDateStr}`;
        
        // 날짜 필터가 활성화된 경우 추가 디버그 정보
        if (data.length === 0 && allStorageData.length > 0) {
          statusMsg += `\n⚠️ 선택한 날짜 범위에 해당하는 데이터가 없습니다.`;
          statusMsg += `\n💡 "날짜 필터 테스트" 버튼을 눌러 시간대 변환을 확인해보세요.`;
        }
      }
      
      setDebugInfo(prev => prev + '\n' + statusMsg);
      console.log(statusMsg);
      
    } catch (error) {
      console.error('오프라인 데이터 로드 오류:', error);
      setDebugInfo(prev => prev + '\n❌ ' + error.message);
      alert('데이터 로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
      setSelectedIds(new Set());
    }
  };

  // 온라인 모드에서 데이터 로드
  const loadOnlineConsultations = async () => {
    setLoading(true);
    setSelectedIds(new Set());
    try {
      let url = filter === 'all' 
        ? `https://${projectId}.supabase.co/functions/v1/make-server-5cb829a8/consultations`
        : `https://${projectId}.supabase.co/functions/v1/make-server-5cb829a8/consultations?type=${filter}`;
      
      if (dateFilterEnabled && startDate && endDate) {
        // 한국 시간대 기준으로 날짜 문자열 생성
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}startDate=${startDateStr}&endDate=${endDateStr}`;
        console.log('🌐 온라인 모드 날짜 필터 (한국 시간 기준):', startDateStr, '~', endDateStr);
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`서버 오류: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setConsultations(result.data);
        console.log(`온라인 모드에서 ${result.data.length}건의 상담 데이터 로드`);
        const timeInfo = getCurrentKoreanTimeInfo();
        setDebugInfo(`🌐 온라인 모드에서 ${result.data.length}건 로드 완료 (${timeInfo.formatted})`);
      } else {
        throw new Error(result.error || '데이터 로드 실패');
      }
    } catch (error) {
      console.error('온라인 데이터 로드 오류:', error);
      setIsOnlineMode(false);
      setDebugInfo(`온라인 로드 실패: ${error.message} - 오프라인 모드로 전환`);
      alert(`온라인 데이터 로드 실패: ${error.message}\n오프라인 모드로 전환합니다.`);
      loadOfflineConsultations();
    } finally {
      setLoading(false);
    }
  };

  // 상담 데이터 로드
  const fetchConsultations = async () => {
    console.log('=== 상담 데이터 로드 시작 ===');
    const timeInfo = getCurrentKoreanTimeInfo();
    setDebugInfo(`🔄 데이터 로드 시작... (${timeInfo.formatted})`);
    
    // 먼저 서버 상태 확인
    const serverOnline = await checkServerStatus();
    
    if (serverOnline && isOnlineMode) {
      await loadOnlineConsultations();
    } else {
      loadOfflineConsultations();
    }
  };

  // 강제로 데모 데이터 생성 (테스트용) - 시간대 테스트를 위한 다양한 데이터
  const forceGenerateDemoData = () => {
    try {
      // 다양한 시간대 테스트를 위한 데모 데이터
      const demoConsultations = [
        {
          name: '시간대테스트1',
          gender: '여',
          phoneNumber: '010-1111-2222',
          birthDate: '19901201',
          consultationType: 'phone'
        },
        {
          name: '시간대테스트2',
          gender: '남', 
          phoneNumber: '010-3333-4444',
          birthDateFirst: '850315',
          birthDateSecond: '1234567',
          consultationType: 'online'
        },
        {
          name: '시간대테스트3',
          gender: '여',
          phoneNumber: '010-5555-6666',
          birthDate: '19920828',
          consultationType: 'phone'
        }
      ];
      
      const { saveConsultationToStorage } = require('../utils/localStorageManager');
      
      console.log('=== 테스트 데이터 생성 시작 ===');
      demoConsultations.forEach((demo, index) => {
        setTimeout(() => {
          console.log(`📝 테스트 데이터 ${index + 1} 생성:`, demo.name);
          saveConsultationToStorage(demo);
        }, index * 200);
      });
      
      const timeInfo = getCurrentKoreanTimeInfo();
      alert(`테스트 데이터가 추가되었습니다.\n현재 한국 시간: ${timeInfo.formatted}\n현재 한국 날짜: ${timeInfo.dateString}\n\n💡 "데이터 일관성 체크" 버튼으로 저장된 시간 정보를 확인해보세요.`);
      
      // 2초 후 데이터 새로고침 (데이터 저장 완료 대기)
      setTimeout(() => {
        fetchConsultations();
      }, 1500);
    } catch (error) {
      console.error('테스트 데이터 생성 오류:', error);
      alert('테스트 데이터 생성 중 오류가 발생했습니다.');
    }
  };

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    console.log('=== AdminPanel 컴포넌트 마운트 ===');
    const timeInfo = getCurrentKoreanTimeInfo();
    console.log(`현재 한국 시간: ${timeInfo.formatted}`);
    console.log(`현재 한국 날짜: ${timeInfo.dateString}`);
    console.log(`브라우저 시간대: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    
    // 데모 데이터 생성 (처음 사용자용)
    generateDemoData();
    
    // 데이터 로드
    fetchConsultations();
  }, [filter, dateFilterEnabled, startDate, endDate]);

  // 오프라인 CSV 다운로드
  const downloadOfflineCSV = (type: 'all' | 'phone' | 'online' = 'all') => {
    try {
      setDownloading(true);
      
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;
      
      if (dateFilterEnabled && startDate && endDate) {
        // 한국 시간대 기준으로 날짜 문자열 생성
        startDateStr = startDate.toISOString().split('T')[0];
        endDateStr = endDate.toISOString().split('T')[0];
        console.log('📅 CSV 다운로드 날짜 필터 (한국 시간 기준):', startDateStr, '~', endDateStr);
      }

      const data = getFilteredConsultations(type, startDateStr, endDateStr);
      
      if (data.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
      }

      // 파일명 생성 (한국 시간 기준)
      const timeInfo = getCurrentKoreanTimeInfo();
      const dateStr = timeInfo.dateString.replace(/-/g, '');
      const typeStr = type === 'all' ? '전체' : type === 'phone' ? '전화상담' : '온라인분석';
      
      let filename = `치아보험상담신청_${typeStr}`;
      if (dateFilterEnabled && startDate && endDate) {
        const startStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
        const endStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
        
        if (startStr === endStr) {
          filename += `_${startStr}`;
        } else {
          filename += `_${startStr}-${endStr}`;
        }
      } else {
        filename += `_${dateStr}`;
      }

      downloadCSV(data, filename);
      alert(`✅ ${data.length}건의 데이터가 다운로드되었습니다.\n한국시간: ${timeInfo.formatted}`);
      
    } catch (error) {
      console.error('오프라인 CSV 다운로드 오류:', error);
      alert(`CSV 다운로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // 선택된 항목 다운로드
  const downloadSelectedOfflineCSV = () => {
    if (selectedIds.size === 0) {
      alert('다운로드할 상담 신청을 선택해주세요.');
      return;
    }

    try {
      setDownloading(true);
      
      const allConsultations = getConsultationsFromStorage();
      const selectedConsultations = allConsultations.filter(c => selectedIds.has(c.id));
      
      if (selectedConsultations.length === 0) {
        alert('선택된 상담 신청 데이터를 찾을 수 없습니다.');
        return;
      }

      const timeInfo = getCurrentKoreanTimeInfo();
      const dateStr = timeInfo.dateString.replace(/-/g, '');
      const filename = `치아보험상담신청_선택${selectedConsultations.length}건_${dateStr}`;

      downloadCSV(selectedConsultations, filename);
      alert(`✅ 선택한 ${selectedConsultations.length}건의 데이터가 다운로드되었습니다.`);
      
    } catch (error) {
      console.error('선택된 항목 다운로드 오류:', error);
      alert(`다운로드 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // 상태 업데이트 (오프라인 모드)
  const updateStatusOffline = (consultationId: string, newStatus: string) => {
    const success = updateConsultationStatus(consultationId, newStatus);
    if (success) {
      fetchConsultations(); // 데이터 새로고침
      const timeInfo = getCurrentKoreanTimeInfo();
      alert(`상담 상태가 업데이트되었습니다. (${timeInfo.formatted})`);
    } else {
      alert('상태 업데이트에 실패했습니다.');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === consultations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(consultations.map(c => c.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const clearSelections = () => {
    setSelectedIds(new Set());
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            {isOnlineMode ? (
              <Wifi className="w-6 h-6 text-green-500" />
            ) : (
              <WifiOff className="w-6 h-6 text-yellow-500" />
            )}
            치아보험 상담 신청 관리자 패널
            <Badge variant={isOnlineMode ? "default" : "secondary"}>
              {isOnlineMode ? "🌐 온라인" : "💾 오프라인"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-sm">
              <Clock className="w-3 h-3" />
              KST: {currentKoreanTime}
            </Badge>
          </CardTitle>
          <CardDescription>
            상담 신청 현황을 확인하고 엑셀 파일로 다운로드할 수 있습니다.
            {!isOnlineMode && " (현재 로컬 데이터를 사용하여 오프라인 모드로 동작 중입니다)"}
            <br />
            <span className="text-xs text-muted-foreground">
              ⏰ 모든 시간은 한국 표준시(KST, UTC+9)로 정확히 표시됩니다.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 디버그 정보 표시 */}
          {debugInfo && (
            <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono whitespace-pre-line">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">디버그 정보</span>
              </div>
              {debugInfo}
            </div>
          )}

          {/* 온라인/오프라인 모드 전환 */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50 flex-wrap">
            <div className="flex items-center gap-2">
              {isOnlineMode ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-yellow-500" />
              )}
              <span className="text-sm font-medium">
                현재 모드: {isOnlineMode ? "온라인" : "오프라인"}
              </span>
            </div>
            
            <Button
              onClick={checkServerStatus}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              서버 연결 확인
            </Button>

            {!isOnlineMode && (
              <>
                <Button
                  onClick={() => generateDemoData()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  데모 데이터 추가
                </Button>

                <Button
                  onClick={forceGenerateDemoData}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-blue-600"
                >
                  <Database className="w-4 h-4" />
                  테스트 데이터 추가
                </Button>

                <Button
                  onClick={checkLocalStorageStatus}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-purple-600"
                >
                  <Database className="w-4 h-4" />
                  스토리지 상태 확인
                </Button>

                <Button
                  onClick={performTimeTest}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-green-600"
                >
                  <TestTube className="w-4 h-4" />
                  시간 테스트
                </Button>

                <Button
                  onClick={performDateFilterTest}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-orange-600"
                >
                  <Filter className="w-4 h-4" />
                  날짜 필터 테스트
                </Button>

                <Button
                  onClick={performDataConsistencyCheck}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-cyan-600"
                >
                  <Search className="w-4 h-4" />
                  데이터 일관성 체크
                </Button>
                
                <Button
                  onClick={() => {
                    if (confirm('모든 로컬 데이터를 삭제하시겠습니까?')) {
                      clearStorage();
                      setConsultations([]);
                      setSelectedIds(new Set());
                      setDebugInfo('로컬 데이터가 삭제되었습니다.');
                      alert('로컬 데이터가 삭제되었습니다.');
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  데이터 초기화
                </Button>
              </>
            )}
          </div>

          {/* 필터 및 액션 버튼 */}
          <div className="space-y-4">
            {/* 상담 유형 필터 */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('all');
                    setSelectedIds(new Set());
                  }}
                >
                  전체
                </Button>
                <Button
                  variant={filter === 'phone' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('phone');
                    setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  전화상담
                </Button>
                <Button
                  variant={filter === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter('online');
                    setSelectedIds(new Set());
                  }}
                  className="flex items-center gap-2"
                >
                  <Monitor className="w-4 h-4" />
                  온라인분석
                </Button>
              </div>
              
              <Button
                onClick={fetchConsultations}
                disabled={loading}
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>

            {/* 날짜 필터 - 한국 시간대 기준으로 개선된 버전 */}
            <div className="flex flex-wrap items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={dateFilterEnabled}
                  onCheckedChange={(checked) => {
                    console.log('📅 날짜 필터 체크박스 변경:', checked);
                    setDateFilterEnabled(!!checked);
                    
                    // 필터 활성화 시 한국 시간 기준으로 기본값 재설정
                    if (checked) {
                      const koreanToday = getKoreanToday();
                      setStartDate(koreanToday);
                      setEndDate(koreanToday);
                      console.log('🇰🇷 한국 시간 기준으로 날짜 초기화:', formatKoreanDate(koreanToday));
                    }
                  }}
                />
                <span className="text-sm font-medium">
                  날짜로 필터링 
                  <Badge variant="outline" className="ml-2 text-xs text-blue-600 border-blue-300">
                    🇰🇷 KST (UTC+9)
                  </Badge>
                  {dateFilterEnabled && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      활성화됨
                    </Badge>
                  )}
                </span>
              </div>

              {dateFilterEnabled && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">시작 날짜:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 h-8"
                        >
                          <CalendarIcon className="w-4 h-4" />
                          {formatKoreanDate(startDate)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            if (date) {
                              // 선택된 날짜를 한국 시간대 기준으로 처리
                              console.log('📅 시작 날짜 선택 (한국 시간 기준):', date.toISOString().split('T')[0]);
                              console.log('🇰🇷 한국 날짜 표시:', formatKoreanDate(date));
                              setStartDate(date);
                              if (date > endDate) {
                                setEndDate(date);
                                console.log('📅 종료 날짜도 같이 업데이트:', formatKoreanDate(date));
                              }
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm">종료 날짜:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 h-8"
                        >
                          <CalendarIcon className="w-4 h-4" />
                          {formatKoreanDate(endDate)}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            if (date) {
                              // 선택된 날짜를 한국 시간대 기준으로 처리
                              console.log('📅 종료 날짜 선택 (한국 시간 기준):', date.toISOString().split('T')[0]);
                              console.log('🇰🇷 한국 날짜 표시:', formatKoreanDate(date));
                              setEndDate(date);
                              if (date < startDate) {
                                setStartDate(date);
                                console.log('📅 시작 날짜도 같이 업데이트:', formatKoreanDate(date));
                              }
                            }
                          }}
                          initialFocus
                          disabled={(date) => {
                            // 한국 시간 기준으로 날짜 제한 설정
                            const koreanToday = getKoreanToday();
                            return date > koreanToday || date < startDate;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 한국 시간 기준으로 오늘 날짜 설정
                        const koreanToday = getKoreanToday();
                        console.log('📅 한국 시간 기준 오늘 날짜로 설정:', koreanToday.toISOString().split('T')[0]);
                        console.log('🇰🇷 표시:', formatKoreanDate(koreanToday));
                        setStartDate(koreanToday);
                        setEndDate(koreanToday);
                      }}
                    >
                      오늘 (KST)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 한국 시간 기준으로 최근 7일 설정
                        const koreanToday = getKoreanToday();
                        const weekAgo = new Date(koreanToday);
                        weekAgo.setUTCDate(koreanToday.getUTCDate() - 7);
                        console.log('📅 한국 시간 기준 최근 7일 설정:', weekAgo.toISOString().split('T')[0], '~', koreanToday.toISOString().split('T')[0]);
                        console.log('🇰🇷 표시:', formatKoreanDate(weekAgo), '~', formatKoreanDate(koreanToday));
                        setStartDate(weekAgo);
                        setEndDate(koreanToday);
                      }}
                    >
                      최근 7일 (KST)
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground border-l pl-4">
                    현재 필터: {startDate.toISOString().split('T')[0]} ~ {endDate.toISOString().split('T')[0]}
                    <br />
                    <span className="text-yellow-600">
                      ⚠️ 8월 1일 데이터가 보이지 않으면 8월 3일로 선택해보세요
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 다운로드 버튼 그룹 */}
          <div className="space-y-4">
            {/* 전체 다운로드 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">전체 다운로드:</span>
              <Button
                onClick={() => downloadOfflineCSV('all')}
                size="sm"
                className="flex items-center gap-2"
                disabled={loading || downloading}
              >
                <Download className="w-4 h-4" />
                전체 다운로드
              </Button>
              <Button
                onClick={() => downloadOfflineCSV('phone')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                disabled={loading || downloading}
              >
                <Phone className="w-4 h-4" />
                전화상담만
              </Button>
              <Button
                onClick={() => downloadOfflineCSV('online')}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                disabled={loading || downloading}
              >
                <Monitor className="w-4 h-4" />
                온라인분석만
              </Button>
            </div>

            {/* 선택적 다운로드 */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">선택 다운로드:</span>
              <Button
                onClick={downloadSelectedOfflineCSV}
                size="sm"
                variant="secondary"
                className="flex items-center gap-2"
                disabled={loading || downloading || selectedIds.size === 0}
              >
                <Download className="w-4 h-4" />
                선택한 {selectedIds.size}건 다운로드
              </Button>
              
              {consultations.length > 0 && (
                <>
                  <Button
                    onClick={toggleSelectAll}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={loading || downloading}
                  >
                    {selectedIds.size === consultations.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                    {selectedIds.size === consultations.length ? '전체 해제' : '전체 선택'}
                  </Button>
                  
                  {selectedIds.size > 0 && (
                    <Button
                      onClick={clearSelections}
                      size="sm"
                      variant="ghost"
                      className="flex items-center gap-2"
                      disabled={loading || downloading}
                    >
                      <Trash2 className="w-4 h-4" />
                      선택 해제
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="text-xs text-muted-foreground border-t pt-2">
              💡 <strong>사용법:</strong> 다운로드 파일은 엑셀에서 열 수 있는 CSV 형식입니다. 
              {!isOnlineMode && " 현재 오프라인 모드로 로컬 데이터를 사용하고 있습니다."}
              <br />
              ⏰ <strong>시간 정보:</strong> 모든 시간은 한국 표준시(KST, UTC+9)로 정확히 계산되어 표시됩니다. 브라우저 시간대와 무관합니다.
              {dateFilterEnabled && (
                <>
                  <br />
                  📅 <strong>날짜 필터:</strong> 현재 {startDate.toISOString().split('T')[0]} ~ {endDate.toISOString().split('T')[0]} 범위로 필터링 중입니다.
                  <br />
                  🚨 <strong>중요:</strong> 8월 1일 신청 데이터가 8월 3일에서 찾아진다면 시간대 변환에 오류가 있습니다. "날짜 필터 테스트" 버튼으로 확인하세요.
                </>
              )}
            </div>
          </div>

          {/* 상담 신청 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg">상담 신청 목록</h3>
                {dateFilterEnabled && (
                  <p className="text-sm text-muted-foreground mt-1">
                    📅 {formatKoreanDate(startDate)} ~ {formatKoreanDate(endDate)} (한국시간 기준)
                  </p>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                총 {consultations.length}건 {selectedIds.size > 0 && `(${selectedIds.size}건 선택)`}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>데이터를 불러오는 중...</span>
                </div>
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {dateFilterEnabled ? (
                  <>
                    선택한 날짜 범위({startDate.toISOString().split('T')[0]} ~ {endDate.toISOString().split('T')[0]})에 
                    {filter === 'all' ? ' 상담 신청이' : 
                     filter === 'phone' ? ' 전화 상담 신청이' : 
                     ' 온라인 분석 신청이'} 없습니다.
                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      <strong>🚨 시간대 문제 체크:</strong>
                      <br />
                      8월 1일에 신청한 데이터가 보이지 않는다면 8월 3일로 날짜를 선택해보세요.
                      <br />
                      "날짜 필터 테스트" 버튼으로 시간대 변환을 확인할 수 있습니다.
                    </div>
                  </>
                ) : (
                  <>
                    {filter === 'all' ? '상담 신청이 없습니다.' : 
                     filter === 'phone' ? '전화 상담 신청이 없습니다.' : 
                     '온라인 분석 신청이 없습니다.'}
                  </>
                )}
                {!isOnlineMode && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm">테스트를 위해 데이터를 추가해보세요:</p>
                    <div className="flex gap-2 justify-center flex-wrap">
                      <Button
                        onClick={() => generateDemoData()}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Database className="w-4 h-4" />
                        데모 데이터 생성
                      </Button>
                      <Button
                        onClick={forceGenerateDemoData}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-blue-600"
                      >
                        <Database className="w-4 h-4" />
                        시간대 테스트 데이터 추가
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {consultations.map((consultation) => (
                  <Card key={consultation.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={selectedIds.has(consultation.id)}
                          onCheckedChange={() => toggleSelectItem(consultation.id)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {consultation.consultationType === 'phone' ? (
                                  <Phone className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <Monitor className="w-4 h-4 text-emerald-500" />
                                )}
                                <span className="font-medium">{consultation.name}</span>
                                <span className="text-muted-foreground">({consultation.gender})</span>
                              </div>
                              <Badge variant={consultation.consultationType === 'phone' ? 'default' : 'secondary'}>
                                {consultation.consultationTypeKorean}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant={getStatusBadgeVariant(consultation.status)}>
                                {consultation.statusKorean}
                              </Badge>
                              
                              {!isOnlineMode && (
                                <select
                                  value={consultation.status}
                                  onChange={(e) => updateStatusOffline(consultation.id, e.target.value)}
                                  className="text-xs px-2 py-1 border rounded"
                                >
                                  <option value="pending">대기중</option>
                                  <option value="processing">처리중</option>
                                  <option value="completed">완료</option>
                                  <option value="cancelled">취소</option>
                                </select>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">전화번호:</span>
                              <span className="ml-2">{consultation.phoneNumber}</span>
                            </div>
                            
                            {consultation.birthDate && (
                              <div>
                                <span className="text-muted-foreground">생년월일/주민번호:</span>
                                <span className="ml-2">{consultation.birthDate}</span>
                              </div>
                            )}
                            
                            <div>
                              <span className="text-muted-foreground">신청일시 (KST):</span>
                              <span className="ml-2">{consultation.submittedAtFormatted}</span>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground">
                            ID: {consultation.id}
                            <br />
                            원본 시간: {consultation.submittedAt}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}