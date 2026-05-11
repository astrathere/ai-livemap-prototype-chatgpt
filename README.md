# AI 라이브맵 작업자용 배포용 프로토타입

## 바로 보기 / 배포 추천 방식

### Netlify Drop
1. 이 압축 파일을 풉니다.
2. 압축을 푼 폴더 안의 `ai_livemap_deploy_ready` 폴더를 Netlify Drop에 드래그앤드롭합니다.
3. 생성된 URL을 공유합니다.

Netlify Drop은 별도 빌드 과정 없이 정적 HTML/CSS/JS를 바로 배포할 수 있어 화면설계 검토용 프로토타입에 적합합니다.

## 실행 방법

로컬에서는 `index.html`을 브라우저에서 열면 됩니다.

## 지도

이번 버전은 OpenStreetMap 타일만 사용합니다.

- OSM 기본 지도
- OSM HOT 지도
- OSM 기본 2

우측 상단 레이어 버튼을 클릭하면 지도 종류를 바꿀 수 있습니다.

## 포함 기능

- 실제 지도 이동/확대/축소
- 좌상단 계획 패널 접기/펼치기
- 검색어 입력 및 Enter 검색
- 하단 조작 가이드 모드 전환
- 툴바 버튼 동작
  - 열기
  - 임시 저장
  - 삭제
  - 실행 취소
  - 다시 실행
  - 이동
  - 핀 추가
  - 경로/링크 생성
  - 확인
- 지도 클릭으로 핀/구역/경로 예시 생성
- `Esc`: 선택/모드 해제
- `Ctrl/Cmd + S`: 저장
- `Ctrl/Cmd + Z`: 실행 취소

## 참고

인터넷 연결이 필요합니다.
외부 지도 타일 CDN을 사용하므로 회사 보안망에서 차단될 경우 지도가 표시되지 않을 수 있습니다.


## GitHub Pages 주의사항

GitHub Pages의 프로젝트 사이트에서는 `/script.js`, `/style.css`처럼 앞에 `/`가 붙은 절대 경로를 쓰면 저장소 경로가 빠져 파일을 못 불러올 수 있습니다.

이 버전은 아래처럼 상대 경로를 사용합니다.

```html
<link rel="stylesheet" href="./style.css" />
<script src="./script.js"></script>
```

브라우저 개발자도구 Console에서 `[AI LiveMap] script.js loaded`가 보이면 JS 파일이 정상 로드된 것입니다.


## v iframe OSM 임베드 버전

이 버전은 Leaflet 타일 레이어 방식 대신 OpenStreetMap 공식 embed iframe을 사용합니다.

이유:
- GitHub Pages에서 Leaflet은 로드되지만 지도 타일만 회색으로 보이는 환경 대응
- 브라우저/확장 프로그램/네트워크에서 개별 타일 요청이 불안정한 경우를 회피
- 최소한 배포 URL에서 지도 화면이 안정적으로 보이도록 처리

제약:
- 지도 자체는 iframe 내부에서 직접 드래그/확대/축소합니다.
- 외부 툴바의 확대/축소 버튼은 안내 토스트만 표시합니다.
- 실제 핀/구역/링크 편집은 향후 Leaflet/Map SDK 방식으로 다시 연결하는 것이 적합합니다.
