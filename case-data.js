window.CASE_STUDIES = [
  {
    slug: "chart-pipeline",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl: "https://github.com/kangjoo2002/hipster/blob/main/portfolio/chart-pipeline.md",
    title: "차트 공개 기준이 저장소마다 달라지던 문제 해결",
    summary:
      "차트 계산과 공개 시점을 나누고, 캐시·검색·DB·갱신 시각이 모두 같은 공개 기준을 따르도록 맞췄습니다.",
    metrics: [
      { label: "공개 기준", value: "공개 버전 테이블 한 곳에서 관리" },
      { label: "전환 단계", value: "생성 → 검증 → 공개 → 제공" },
      { label: "일관성 범위", value: "DB, 검색 인덱스, 캐시, 갱신 시각" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "배치가 끝났다는 사실만으로는 사용자에게 같은 차트가 공개됐다고 말할 수 없었습니다. 어떤 저장소는 새 결과를 가리키고, 어떤 저장소는 이전 결과를 가리키는 상태가 생기면 차트 공개 기준 자체가 흔들렸습니다.",
          "특히 결과보다 갱신 시각이 먼저 바뀌면, 사용자 입장에서는 '업데이트된 차트'라는 문구와 예전 결과가 동시에 보일 수 있었습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "핵심은 배치 속도보다 공개 기준이 흩어져 있다는 점이었습니다. 계산을 더 빨리 끝내는 것보다, 지금 무엇이 공개 중인지부터 한곳에서 정해야 했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "차트 작업을 생성, 검증, 공개, 제공 단계로 나눴습니다.",
          "현재 공개 중인 버전은 별도 공개 기준 테이블 한 곳에서 관리했습니다.",
          "DB 공개 테이블, 검색 인덱스 별칭, 응답 캐시, 갱신 시각이 모두 같은 공개 버전을 따르게 했습니다.",
          "검증에 실패한 후보는 공개하지 않고 기존 버전을 그대로 유지했습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "공개 단계 완료 후 `publishedAt`과 `apiVisibleAt` 차이를 측정하고, Redis 공개 버전·`lastUpdated`·Elasticsearch alias·API 응답이 모두 같은 버전을 가리키는지 종단 간으로 확인했습니다. 롤백과 Redis 키 유실 상황에서도 `chart_publish_state.current_version` 한 기준으로 복원 가능한지 함께 검증했습니다. 배치 완료와 공개 완료가 분리되면서, 이전에는 설명하기 어려웠던 \"어느 버전이 지금 노출 중인가\"를 단일 기준으로 말할 수 있게 됐습니다.",
        ],
      },
      {
        heading: "운영 포인트",
        bullets: [
          "배치 완료 여부보다 공개 버전 전환 기록으로 상태를 보게 했습니다.",
          "공개 단계가 실패해도 이전 버전으로 바로 되돌릴 수 있게 했습니다.",
          "운영자는 현재 어떤 결과가 노출 중인지 한 기준으로 확인하게 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "chart-serving",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl: "https://github.com/kangjoo2002/hipster/blob/main/portfolio/chart-serving.md",
    title: "차트 API 병목을 검색 경로와 메타데이터 경로로 분리",
    summary:
      "차트 API를 한 덩어리 조회로 다루지 않고, 캐시·검색·공통 정보·우회 조회로 나눠 병목을 줄였습니다.",
    metrics: [
      { label: "장르 필터 응답 시간", value: "65,421ms → 178.37ms" },
      { label: "반복 요청 응답 시간", value: "11,386ms → 16.73ms" },
      { label: "갱신 시각 조회", value: "4,732ms → 1.00ms" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "차트 API는 단순 상위 목록 조회가 아니라 필터, 정렬, 검색, 공통 정보를 함께 처리하는 읽기 요청이었습니다. 겉으로는 점수 테이블 하나의 문제처럼 보여도 실제로는 검색과 공통 정보 조회가 한 요청 안에 뒤섞여 있었습니다.",
          "Redis와 Elasticsearch가 비정상일 때는 API 전체가 함께 흔들렸고, 캐시 미스 경로도 너무 비쌌습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "응답 시간을 줄이려면 쿼리 하나를 더 깎는 것보다 요청을 역할별로 나누는 편이 맞았습니다. 캐시 적중, 검색, 공통 정보, DB 우회 조회를 분리해 각각 다루기로 했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "읽기 전용 조회 테이블을 두고, 차트 점수와 필터 기준을 미리 계산해 뒀습니다.",
          "Redis에는 최종 응답을 캐시하고, 반복 요청은 캐시 적중 경로로 빠지게 만들었습니다.",
          "Elasticsearch는 릴리즈 후보를 찾는 검색 역할에만 쓰도록 좁혔습니다.",
          "갱신 시각 같은 공통 정보는 별도 조회로 떼어냈습니다.",
          "Redis나 Elasticsearch가 흔들리면 DB 조회로 바로 우회하게 했습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "같은 500만 건 데이터셋 기준으로 `wall/total/search/hydrate/lastUpdated/assemble` 지표를 단계별로 비교했고, 캐시 cold miss/miss/hit도 분리 측정했습니다. MySQL `Handler_read%`와 `Sort_merge_passes`로 조인 비용 감소와 잔존 병목 위치도 확인했습니다. 단일 조회였던 API가 Redis·Elasticsearch·MySQL·메타데이터 경로로 나뉘면서, 부분 장애에서도 API를 끊지 않는 구조가 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "chart-batch-performance",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl: "https://github.com/kangjoo2002/hipster/blob/main/portfolio/chart-batch-performance.md",
    title: "차트 재생성 배치 시간이 길던 문제 해결",
    summary:
      "차트 재생성 배치를 한 덩어리로 보지 않고, 조립·DB 적재·검색 인덱싱 단계로 나눠 병목을 줄였습니다.",
    metrics: [
      { label: "차트 재생성 배치 시간", value: "약 87.9분 → 약 23.9분" },
      { label: "ES 재색인 총 시간", value: "7,455.67ms → 953.67ms" },
      { label: "배치 조립 단계 시간", value: "2,109.67ms → 573.67ms" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "차트 조회를 빠르게 만든 뒤에는 그 결과를 만드는 재생성 배치 비용이 다음 문제로 올라왔습니다. 처음에는 전체 배치가 느리다는 사실만 있었고, 조립 단계, DB 적재, 검색 인덱싱 중 어디가 진짜 병목인지 분명하지 않았습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "배치를 한 번에 최적화하면 어디가 좋아졌는지 잡기 어렵습니다. 조립 단계와 적재 단계를 쪼개고, 검색 인덱싱도 조회와 벌크 적재로 나눠 측정했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "배치 조립 단계의 메타데이터 조회를 JPA 조인 대신 JDBC 집계 쿼리로 바꿨습니다.",
          "직접 갱신 대신 임시 적재 후 공개하는 흐름으로 바꿔 후보 결과를 가볍게 쌓았습니다.",
          "검색 인덱싱은 페이지 단위 조회 대신 키셋 기반 조회로 바꿨습니다.",
          "벌크 적재와 refresh 정책을 조정해 인덱싱 시간을 줄였습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "배치 시간이 줄어든 것만큼, 어느 단계가 다시 느려지는지 바로 잡을 수 있게 된 점도 컸습니다. 이후 재생성 비용을 단계별로 나눠 볼 수 있게 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "rating-aggregation",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl: "https://github.com/kangjoo2002/hipster/blob/main/portfolio/rating-aggregation.md",
    title: "원본 평점 테이블에 몰린 조회·갱신 부담 분리",
    summary:
      "원본 평점 저장과 사용자에게 보여줄 집계 결과를 분리해, 조회와 등록이 서로 발목 잡지 않게 만들었습니다.",
    metrics: [
      { label: "평점 집계 조회 응답 시간", value: "806ms → 20ms" },
      { label: "동시 등록 평균 응답 시간", value: "126ms → 12.95ms" },
      { label: "원본 쓰기 범위", value: "원본 평점 기록에만 집중" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "원본 평점 테이블은 평점 저장소이면서 동시에 평균 평점 조회와 가중치 반영까지 떠안고 있었습니다. 조회를 빠르게 하려면 쓰기 부담이 커지고, 쓰기 부담을 줄이려면 조회가 느려지는 구조였습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "원본 데이터와 사용자에게 보여줄 결과를 나누지 않으면 읽기와 쓰기 둘 다 계속 흔들릴 수밖에 없었습니다. 원본은 기록에 집중시키고, 릴리즈 단위 집계는 별도 계층으로 분리했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "릴리즈 단위 집계 테이블을 읽기 기준으로 분리했습니다.",
          "평점 저장은 원본 테이블에만 반영하고, 집계 갱신은 커밋 이후 비동기 처리로 넘겼습니다.",
          "메시지 큐 소비와 주기적 보정 배치를 함께 둬 늦게 반영된 집계도 맞췄습니다.",
          "차트는 원본 평점이 아니라 집계 결과를 기준으로 읽게 바꿨습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "Testcontainers 환경에서 조회 10,000건·단건 쓰기·동시 100건 등록 시나리오를 동기 갱신과 `AFTER_COMMIT` 비동기 반영으로 나눠 비교 측정했습니다. `AntiEntropyBatchJob`으로 집계 불일치를 전체 재집계로 덮어쓸 수 있는 복구 경로도 검증했습니다. 가중치 변경이 과거 `ratings` 전체 재기록으로 퍼지지 않고, 집계 재계산 경로로만 반영되는 구조가 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "user-credibility-batch",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl: "https://github.com/kangjoo2002/hipster/blob/main/portfolio/user-credibility-batch.md",
    title: "유저 가중치 변경이 대량 갱신으로 번지던 문제 해결",
    summary:
      "가중치 계산 속도보다, 가중치 변경이 원본 평점 전체 수정으로 퍼지는 구조를 먼저 줄였습니다.",
    metrics: [
      { label: "가중치 배치 시간", value: "921,000ms → 359,200ms" },
      { label: "유저 통계 계산 시간", value: "10,420ms → 1,138ms" },
      { label: "직접 쓰기 범위", value: "유저 정보와 통계 테이블로 축소" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "처음에는 배치가 느리다는 현상부터 보였지만, 실제로는 가중치 변경이 과거 평점 전체 수정으로 번지는 구조가 더 큰 문제였습니다. 가중치 변경 한 번이 여러 쓰기와 배치 비용을 함께 키웠습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "가중치를 더 빨리 계산하는 것보다 계산 결과를 어디까지 직접 써야 하는지 먼저 줄여야 했습니다. 원본 평점 행을 다시 쓰지 않는 쪽으로 책임 경계를 바꿨습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "가중치 계산 결과는 유저 정보와 통계 테이블에만 직접 반영했습니다.",
          "원본 평점 전체를 다시 쓰게 만드는 직접 반영 컬럼을 제거했습니다.",
          "최신 가중치는 이후 집계 단계가 읽어 전체 결과에 반영하게 했습니다.",
          "배치는 Spring Batch로 옮겨 재시작 지점과 청크 단위 제어가 가능해졌습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "배치 시간과 메모리 사용량이 줄었고, 가중치 변경이 원본 평점 전체 수정으로 퍼지는 일도 막았습니다. 이후 복구와 재계산도 단계별로 나눠 다루기 쉬워졌습니다.",
        ],
      },
    ],
  },
  {
    slug: "settlement-pay-and-reconcile",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl:
      "https://github.com/kangjoo2002/hipster/blob/main/portfolio/settlement-pay-and-reconcile.md",
    title: "정산 후 실제 지급까지 추적 가능한 상태 모델링",
    summary:
      "총 적립액만으로는 보이지 않던 정산 상태를 요청·예약·지급·조정으로 나눠 실제 지급 흐름을 끝까지 추적했습니다.",
    metrics: [
      { label: "핵심 기준", value: "정산 요청 단위로 상태 추적" },
      { label: "보호 장치", value: "예약 유지 + 미확정/조정 상태 분리" },
      { label: "추적 범위", value: "요청 생성 → 지급 → 후속 조정" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "적립 원장은 무엇이 쌓였는지까지는 보여줬지만, 정산이 시작되면 질문이 달라졌습니다. 총 적립 잔액과 지금 보낼 수 있는 금액이 왜 다른지, 외부 지급이 타임아웃 났을 때 실제 송금은 어떻게 됐는지까지 따라갈 수 있어야 했습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "정산은 잔액을 바로 깎는 기능보다 요청 단위 추적 모델이 먼저 필요했습니다. 그래서 요청 생성, 금액 예약, 외부 지급, 후속 확인과 조정으로 이어지는 흐름으로 다시 세웠습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "정산은 요청 번호, 요청 금액, 예약 금액, 외부 참조, 상태를 함께 가진 요청 단위로 다뤘습니다.",
          "총 적립 잔액과 실제 정산 가능 금액을 분리하고, 예약 중인 금액과 열린 조정은 별도로 계산했습니다.",
          "외부 지급 결과는 성공·실패로 성급히 단정하지 않고 미확정 상태와 후속 확인 흐름으로 흡수했습니다.",
          "늦은 실패나 정정은 기존 성공 기록을 덮어쓰지 않고 조정 기록으로 남겼습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "정산은 단순 잔액 차감이 아니라, 요청마다 예약·미확정·성공·조정 필요 상태를 남기는 흐름이 됐습니다. 외부 지급의 늦은 실패나 정정도 같은 요청 안에서 이어서 추적할 수 있게 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "reward-ledger",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl: "https://github.com/kangjoo2002/hipster/blob/main/portfolio/reward-ledger.md",
    title: "검증된 기여만 적립으로 인정하는 보상 원장 분리",
    summary:
      "검수 승인과 적립을 한 트랜잭션에 묶지 않고, 적립·차단·취소를 원장에 따로 남기도록 나눴습니다.",
    metrics: [
      { label: "멱등 기준", value: "승인 건당 최대 1회 적립" },
      { label: "정책 상태", value: "한도 초과와 취소 이력 구분" },
      { label: "도메인 연결", value: "이벤트 기반 비동기 전달" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "승인된 기여에 보상을 주려면 무엇이 인정된 기여인지, 왜 적립이 막혔는지, 같은 승인 건이 왜 두 번 적립되지 않는지를 남길 수 있어야 했습니다. 승인과 적립을 한 흐름에 묶으면 품질 판단과 보상 정책이 서로 끌려다니는 문제가 생겼습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "검수는 승인 여부를 확정하고, 적립은 승인된 기여를 어떤 보상 상태로 남길지만 맡아야 했습니다. 검수는 승인 사실만 넘기고, 적립은 그 결과를 받아 자기 원장에서 처리하도록 책임을 갈랐습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "검수는 승인 이벤트를 남기고, 적립은 이를 비동기로 받아 처리하게 했습니다.",
          "승인 건 식별자를 적립 기준으로 삼아 같은 승인에 대해 한 번만 적립되게 했습니다.",
          "서비스 멱등성과 DB 고유 제약을 함께 둬 중복 적립을 막았습니다.",
          "한도 초과와 취소는 별도 상태로 남겨 시간순으로 추적하게 했습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "적립은 단순 포인트 합산이 아니라 승인, 차단, 취소 이유를 남기는 원장 역할을 하게 됐습니다. 검수 판단과 보상 정책도 서로 덜 얽히게 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "moderation-queue",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl: "https://github.com/kangjoo2002/hipster/blob/main/portfolio/moderation-queue.md",
    title: "검수 적체와 담당 전환을 운영 가능한 대기열로 재구성",
    summary:
      "검수 요청을 상태 목록이 아니라 담당자, 이력, SLA가 함께 보이는 운영 대기열로 바꿨습니다.",
    metrics: [
      { label: "상태 기준", value: "현재 상태와 운영 이력 분리" },
      { label: "운영 장치", value: "공식 담당 전환 + 만료 회수" },
      { label: "가시성", value: "응답과 지표에 같은 SLA 기준 반영" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "초기 검수 구조에는 점유와 승인·반려 흐름은 있었지만, 누가 맡고 있는지, 왜 다시 대기로 돌아왔는지, 무엇이 오래 막혀 있는지를 시스템 안에서 바로 읽기 어려웠습니다. 그 공백은 운영자의 수동 정리와 기억에 기대고 있었습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "검수 적체는 양만 줄이는 문제가 아니라, 누가 맡고 있고 왜 막혔는지 남길 수 있어야 했습니다. 담당 전환, 점유 회수, SLA 가시성은 결국 같은 운영 질문에 대한 답이었습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "현재 대기열에는 담당자, 점유 만료 시각, 검수 상태처럼 지금 필요한 정보만 남겼습니다.",
          "운영 이력에는 점유, 담당 전환, 만료 회수, 승인·반려를 시간순으로 기록했습니다.",
          "담당 전환은 정식 절차로 두고, 상태 수는 불필요하게 늘리지 않았습니다.",
          "방치된 점유는 백그라운드 회수로 처리하고, 마지막 액션 보정도 별도로 뒀습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "검수 대기열은 단순 보관소가 아니라 운영자가 바로 판단할 수 있는 화면으로 바뀌었습니다. 담당 전환과 적체 상태를 같은 기준으로 볼 수 있게 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "feed-read-path-index-batch-denormalization",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/feed-read-path-index-batch-denormalization.md",
    title: "29초 걸리던 피드 조회를 중간 테이블 없이 개선",
    summary:
      "피드 전용 테이블을 바로 만들지 않고, 인덱스 정비·개수 없는 페이지 조회·묶음 조회·반정규화로 읽기 비용을 먼저 줄였습니다.",
    metrics: [
      { label: "피드 기본 조회 응답 시간", value: "29,000ms → 45ms" },
      { label: "정렬 대상 행 수", value: "7,236 → 1,091" },
      { label: "정렬 메모리 사용량", value: "83,968 → 12,089" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "기존 피드 조회는 게시글 목록을 읽은 뒤 작성자, 미디어, 좋아요, 댓글 수를 응답 조립 과정에서 다시 따라가는 구조였습니다. 쿼리 자체도 무거웠고, 응답을 만드는 동안 추가 조회가 계속 이어졌습니다.",
          "조회만 보면 중간 피드 테이블이 쉬운 선택처럼 보였지만, 발행과 정리 비용이 뒤따라 들어오는 구조였습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "피드 전용 저장소를 새로 두기 전에 현재 조회를 어디까지 줄일 수 있는지 먼저 확인해야 했습니다. 팔로우와 게시글을 직접 읽는 구조는 유지하되, 병목부터 차례로 걷어내기로 했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "팔로우 관계와 게시글 작성 시각 기준으로 인덱스를 다시 잡았습니다.",
          "전체 개수 계산이 없는 페이지 조회로 카운트 쿼리를 제거했습니다.",
          "미디어와 좋아요는 묶음 조회로 읽고, 댓글 수는 별도 집계 컬럼으로 분리했습니다.",
          "작성자 이름은 게시글에 함께 보관해 사용자 조인을 줄였습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "중간 테이블 없이도 읽기 비용을 크게 줄였고, 이후 발행형 피드로 넘어갈지 판단할 기준도 더 분명해졌습니다.",
        ],
      },
    ],
  },
  {
    slug: "separate-feed-cache-and-post-interactions",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/separate-feed-cache-and-post-interactions.md",
    title: "게시글 캐시와 좋아요 계층을 분리해 경합 완화",
    summary:
      "본문 같은 정적 데이터와 좋아요·카운트 같은 가변 데이터를 나눠 캐시 경합을 줄이고, 삭제된 게시글 반복 조회도 막았습니다.",
    metrics: [
      { label: "좋아요 평균 응답 시간", value: "500ms → 169ms" },
      { label: "좋아요 처리량", value: "101.1건/s → 315.5건/s" },
      { label: "좋아요 정합성", value: "명시적 갱신으로 100/100 유지" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "피드 목록에서는 postId만 들고 있어도, 실제 응답을 만들려면 게시글 본문과 좋아요 상태를 함께 읽어야 했습니다. 그런데 본문은 상대적으로 덜 변하고, 좋아요와 카운트는 계속 변하는 데이터였습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "성격이 다른 데이터를 같은 캐시 키에 넣으면 조회는 단순해 보여도 갱신 비용이 커집니다. 게시글 본문과 상호작용 데이터를 나누고, 삭제된 게시글은 빈 값으로 캐시해 반복 조회도 막기로 했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "게시글 본문, 작성자, 미디어는 게시글 캐시로 묶었습니다.",
          "좋아요 여부와 개수는 별도 계층에서 읽어 응답 조립 단계에서 합쳤습니다.",
          "좋아요 수는 명시적 증가·감소 갱신으로 정합성을 맞췄습니다.",
          "사용자별 좋아요 여부는 별도 집합 캐시로 관리했습니다.",
          "삭제된 게시글은 빈 값 캐시로 남겨 반복 조회를 막았습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "본문 캐시는 오래 유지하고, 자주 바뀌는 상호작용만 따로 갱신하게 되면서 경합이 줄었습니다. 조회 성능과 쓰기 정합성도 함께 챙길 수 있게 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "replication-proxy-failover",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/replication-proxy-failover.md",
    title: "ProxySQL과 Orchestrator로 피드 조회 경로와 복구 체계 개선",
    summary:
      "읽기·쓰기 분기와 장애 복구를 애플리케이션 안에서 처리하지 않고, ProxySQL과 Orchestrator로 바깥 계층에 나눠 맡겼습니다.",
    metrics: [
      { label: "피드 조회 API 평균 응답 시간", value: "319ms → 140ms" },
      { label: "읽기/쓰기 분기", value: "ProxySQL이 역할별로 라우팅" },
      { label: "장애 복구", value: "Orchestrator가 자동 전환 담당" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "초기에는 애플리케이션이 직접 주 서버와 읽기 서버를 나누고 있었습니다. 평상시에는 동작했지만, 장애 전환과 복제 토폴로지 변경까지 계속 쫓아가야 하는 구조였습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "라우팅은 비즈니스 로직보다 인프라 상태에 가까운 책임입니다. 애플리케이션이 현재 주 서버를 직접 판단하기보다, 바깥 계층이 그 결정을 내려주는 편이 맞았습니다.",
        ],
      },
      {
        heading: "ProxySQL",
        bullets: [
          "복제 운영 기준을 정비하고, ProxySQL이 쓰기 노드와 읽기 노드를 나누게 했습니다.",
          "일반 조회, 잠금이 필요한 조회, 쓰기 요청을 역할에 맞게 분기했습니다.",
          "애플리케이션은 DB 역할 전환을 직접 추적하지 않고 프록시가 정한 결과만 사용하게 했습니다.",
        ],
      },
      {
        heading: "Orchestrator",
        bullets: [
          "Orchestrator가 주 노드 장애 전환과 복제 재구성을 맡았습니다.",
          "3노드 구성으로 운영 계층의 단일 장애 지점을 줄였습니다.",
          "장애 전환 규칙과 복제 상태 해석은 운영 계층에서 관리하게 했습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "읽기 성능도 좋아졌지만, 더 큰 변화는 라우팅과 복구 규칙이 애플리케이션 코드 밖으로 나가 역할이 선명해졌다는 점입니다. 이후 DB 운영 규칙을 코드 배포와 분리해 관리할 수 있게 됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "redis-feed-lifecycle-and-fanout",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/redis-feed-lifecycle-and-fanout.md",
    title: "피드 발행 파이프라이닝으로 전파 비용 단축",
    summary:
      "피드 계산을 조회 시점이 아니라 발행 시점으로 옮기고, Redis 파이프라이닝으로 전파 비용을 줄였습니다.",
    metrics: [
      { label: "피드 발행 시간", value: "1,341ms → 101ms" },
      { label: "10,000명 반영 시간", value: "8,563ms → 270ms" },
      { label: "피드 저장 구조", value: "사용자별 피드 목록에 게시글 ID 저장" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "MySQL에서 매번 피드 조건을 계산하는 구조는 읽기가 늘어날수록 조인, 정렬, I/O 비용이 같이 커졌습니다. 쿼리를 다듬는 것만으로는 '조회 때마다 다시 계산한다'는 구조를 바꾸기 어려웠습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "피드 계산을 읽기 시점에 두기보다, 게시글 발행 시점에 사용자별 피드를 미리 준비하는 쪽이 맞았습니다. 여러 서버가 같은 기준으로 피드를 읽어야 했기 때문에 로컬 캐시보다 Redis 전역 캐시를 선택했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "사용자별 피드 목록에는 게시글 ID만 저장하고, 본문은 다른 계층에서 읽게 했습니다.",
          "팔로워 목록도 Redis 집합으로 관리했습니다.",
          "만료 하나에 기대지 않고 조회 기반 정리와 활동 기반 정리를 나눴습니다.",
          "팔로워마다 개별 삽입을 반복하지 않고 Redis 파이프라이닝으로 묶었습니다.",
          "게시글 저장 응답과 전파 완료를 분리해 전파 작업은 비동기로 넘겼습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "병목은 자료구조보다 네트워크 왕복과 명령 전송 방식에 더 가까웠습니다. 파이프라이닝으로 이 비용을 줄이면서 발행 시간과 운영 부담을 함께 낮췄습니다.",
        ],
      },
    ],
  },
  {
    slug: "connection-pool-optimization",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/connection-pool-optimization.md",
    title: "커넥션 풀 증설이 오히려 성능을 낮춘 원인 분석",
    summary:
      "커넥션 수를 늘리면 좋아질 것이라는 가설을 검증했지만, 피드 조회에서는 CPU·스레드 경합이 더 크게 드러나 풀 최적화만으로는 한계가 있음을 확인했습니다.",
    metrics: [
      { label: "커넥션 50개 실험", value: "응답 지표 악화 + RUNNING 스레드 증가" },
      { label: "커넥션 6개 실험", value: "50개 대비 더 안정 + 최장 RUNNING 약 10,000ms" },
      { label: "핵심 판단", value: "풀 증설 단독 해법 한계 확인" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "커넥션 대기 신호만 보면 풀 크기를 키우면 해결될 것처럼 보였지만, 실제 피드 조회는 DB 대기와 애플리케이션 CPU 작업이 함께 얽힌 경로였습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "대기열 감소만이 아니라 RUNNING 스레드 경합과 전체 응답 편차까지 함께 안정화되는지를 기준으로 풀 조정 효과를 판단했습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "커넥션 풀 확장(50)과 축소(6) 실험을 비교해 단일 가설을 검증했습니다.",
          "대기 시간만 보지 않고 RUNNING 스레드 길이와 경합 증가를 함께 관찰했습니다.",
          "풀 최적화는 적정값 탐색으로 제한하고, 이후 확장 전략으로 의사결정 경계를 분리했습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "커넥션을 늘리는 방식은 병목을 줄이기보다 동시 실행 경쟁을 키울 수 있음을 확인했습니다. 그 결과 커넥션 풀 최적화는 전제 확인 단계로 정리되고, 최종 개선 방향은 수평 확장으로 전환됐습니다.",
        ],
      },
    ],
  },
  {
    slug: "scale-out-over-connection-pool",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/scale-out-over-connection-pool.md",
    title: "서버 수평 확장으로 피드 조회 처리량 개선",
    summary:
      "커넥션 풀 확대 대신 서버를 늘려 CPU 경쟁과 DB 부하를 나누는 쪽으로 방향을 바꿔 처리량을 끌어올렸습니다.",
    metrics: [
      { label: "평균 응답 시간", value: "725ms → 373ms" },
      { label: "95% 응답 시간", value: "1,417ms → 595ms" },
      { label: "처리량", value: "34.3건/s → 79.1건/s" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "요청 대기와 커넥션 풀 대기열만 보면 단순한 커넥션 부족처럼 보였습니다. 풀 크기를 키우면 해결될 것 같았지만, 실제로는 커넥션 수가 늘수록 스레드 경쟁과 컨텍스트 스위칭이 더 심해졌습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "피드 조회는 DB 대기와 CPU 작업이 함께 섞인 요청입니다. 한 서버 안에서 동시 처리량을 무작정 올리기보다, 서버 하나가 감당할 수 있는 수준까지만 연결을 열고 요청을 여러 서버로 나누는 편이 더 안정적이었습니다.",
        ],
      },
      {
        heading: "구조 변경",
        bullets: [
          "커넥션 수를 크게 늘린 구성과 적정 수준으로 묶은 구성을 비교해 CPU 경쟁을 확인했습니다.",
          "서버당 동시 DB 연결 수는 제한하고, 초과 부하는 API 서버를 수평 확장해 분산했습니다.",
          "로드밸런서 환경에서 1대와 3대 구성을 비교해 실제 처리량 차이를 검증했습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "핵심은 커넥션 부족처럼 보이던 현상을 서버 내부 경쟁까지 포함한 문제로 다시 본 점입니다. 그 덕분에 더 안정적인 확장 방법을 선택할 수 있었습니다.",
        ],
      },
    ],
  },
  {
    slug: "redis-read-write-recovery-strategy-split",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/redis-read-write-recovery-strategy-split.md",
    title: "Redis 장애 시 읽기와 쓰기 복구 전략 분리",
    summary:
      "같은 Redis 장애라도 읽기는 DB 우회, 쓰기는 작업 보관 후 재처리로 나눠 대응했습니다.",
    metrics: [
      { label: "읽기 복구", value: "재시도·차단 뒤 DB 우회" },
      { label: "쓰기 복구", value: "작업 큐 보관 후 복구 시 재실행" },
      { label: "검증 방식", value: "장애 재현 통합 테스트" },
    ],
    sections: [
      {
        heading: "문제",
        paragraphs: [
          "Redis를 피드 조회와 게시글 조회 같은 읽기 요청, 그리고 전파 작업 같은 쓰기에 함께 쓰다 보니 장애가 났을 때 리스크가 다르게 드러났습니다. 읽기는 느려져도 우회 응답이 가능했지만, 쓰기는 그 순간 놓치면 전파 근거 자체가 사라질 수 있었습니다.",
        ],
      },
      {
        heading: "판단",
        paragraphs: [
          "읽기와 쓰기에 같은 장애 대응 전략을 적용하지 않기로 했습니다. 읽기의 목표는 응답 유지였고, 쓰기의 목표는 실패한 작업을 버리지 않고 복구 시점까지 보존하는 것이었습니다.",
        ],
      },
      {
        heading: "읽기 복구",
        bullets: [
          "읽기 경로에는 재시도와 서킷 브레이커를 두고, 실패 시 바로 DB 조회로 내려가게 했습니다.",
          "피드 조회는 Redis 접근이 실패하면 DB에서 다시 읽게 했습니다.",
          "게시글 캐시 조회 실패도 DB 조회로 이어지게 했습니다.",
        ],
      },
      {
        heading: "쓰기 복구",
        bullets: [
          "전파 작업 중 Redis 연결 오류나 차단 상태가 나면 작업을 복구 큐에 보관했습니다.",
          "복구 스케줄러는 Redis 응답과 차단 상태를 함께 확인한 뒤 대기 작업을 다시 실행했습니다.",
          "재실행이 성공하면 큐에서 제거하고, 아직 불안정하면 다음 주기로 미뤘습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "Testcontainers로 Redis를 실제로 내리고 올리면서, fan-out 호출 시 WorkQueue 적재 → 복구 감지 → 재처리 성공 → 최종 피드 반영까지 시나리오 전체를 통합 테스트로 확인했습니다. 읽기는 서킷브레이커 후 DB fallback으로 응답을 유지하고, 쓰기는 장애 순간 누락되지 않고 복구 시점에 재실행되는 것을 로그 흐름으로 검증했습니다. 같은 Redis 장애를 단일 전략으로 처리하지 않고 실패 성격별로 운영 모델을 나눈 구조가 됐습니다.",
        ],
      },
      {
        heading: "결과와 한계",
        paragraphs: [
          "통합 테스트에서 Redis down, 큐 적재, 복구 뒤 재실행, 최종 피드 반영까지 확인했습니다. 다만 현재 큐는 메모리 기반이라 프로세스 재시작에는 약합니다. 완전한 내구성이 필요하면 별도 저장소가 필요합니다.",
        ],
      },
    ],
  },
];
