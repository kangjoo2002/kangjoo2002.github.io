window.CASE_STUDIES = [
  {
    slug: "chart-pipeline",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl:
      "https://github.com/kangjoo2002/hipster/blob/main/portfolio/chart-pipeline.md",
    title: "버전형 차트 재생성 파이프라인 구조 설계",
    summary:
      "차트 생성부터 공개까지의 단계를 분리하고, 단 하나의 current_version 참조로 수렴하도록 동기화 파이프라인으로 구축했습니다.",
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
          '공개 단계 완료 후 `publishedAt`과 `apiVisibleAt` 차이를 측정하고, Redis 공개 버전·`lastUpdated`·Elasticsearch alias·API 응답이 모두 같은 버전을 가리키는지 종단 간으로 확인했습니다. 롤백과 Redis 키 유실 상황에서도 `chart_publish_state.current_version` 한 기준으로 복원 가능한지 함께 검증했습니다. 배치 완료와 공개 완료가 분리되면서, 이전에는 설명하기 어려웠던 "어느 버전이 지금 노출 중인가"를 단일 기준으로 말할 수 있게 됐습니다.',
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
    sourceUrl:
      "https://github.com/kangjoo2002/hipster/blob/main/portfolio/chart-serving.md",
    title: "역할 분리를 통한 차트 조회 성능 개선",
    summary:
      "단일 저장소 의존으로 인한 응답 지연을 방지하기 위해 조회 캐시, 검색, 메타데이터 조회를 분리하여 Read Path를 재설계했습니다.",
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
    sourceUrl:
      "https://github.com/kangjoo2002/hipster/blob/main/portfolio/chart-batch-performance.md",
    title: "대규모 차트 재생성 배치 처리 효율화",
    summary:
      "무거운 조인 조회와 건 단위 처리를 청크, 집계, 벌크 삽입 방식으로 분해하여 대규모 트래픽 병목을 타개했습니다.",
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
    sourceUrl:
      "https://github.com/kangjoo2002/hipster/blob/main/portfolio/rating-aggregation.md",
    title: "비동기 파이프라인 및 자가 치유 구조를 통한 결과적 일관성 확보",
    summary:
      "메시지 큐 분리와 Anti-Entropy 배치 구현을 통해 동시 경합으로 발생하는 DB 커넥션 고갈 위협을 해소했습니다.",
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
    sourceUrl:
      "https://github.com/kangjoo2002/hipster/blob/main/portfolio/user-credibility-batch.md",
    title: "테이블 책임 분리를 통한 연쇄 쓰기 쿼리 최적화",
    summary:
      "유저 가중치 반영 시의 원본 평점 재기록 오류를 해결하고 점수 연산을 위임하여 무의미한 연쇄 쓰기를 차단했습니다.",
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
    slug: "reward-ledger",
    project: "Hipster",
    repoUrl: "https://github.com/kangjoo2002/hipster",
    sourceUrl:
      "https://github.com/kangjoo2002/hipster/blob/main/portfolio/reward-ledger.md",
    title: "Outbox 패턴을 통한 비동기 적립 이벤트 재처리 아키텍처",
    summary:
      "2PC 분산 트랜잭션 수립이 어려운 환경에서, 로컬 DB 커밋과 보관 테이블을 구축하고 메시지 큐 이벤트의 멱등성을 검증했습니다.",
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
    slug: "feed-read-path-index-batch-denormalization",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/feed-read-path-index-batch-denormalization.md",
    title: "EXPLAIN 분석을 통한 대용량 피드 조회 최적화",
    summary:
      "1억 4천만 건 조인 환경에서 임시 테이블과 정렬 병목을 해소하고 @BatchSize 조회 방식을 선제 적용했습니다.",
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
    title: "DB 관통 방어를 위한 계층형 캐시 전략",
    summary:
      "정적, 가변 데이터를 계층 분리하여 캐싱하고 삭제된 데이터에 대해 Null Object 패턴을 반환하여 원본 조회 차단에 성공했습니다.",
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
    slug: "connection-pool-optimization",
    project: "SNS",
    repoUrl: "https://github.com/kangjoo2002/sns",
    sourceUrl:
      "https://github.com/kangjoo2002/sns/blob/main/portfolio/connection-pool-optimization.md",
    title: "스레드 덤프 분석을 통한 커넥션 풀 사이즈 하향 튜닝",
    summary:
      "제한된 코어 내에서의 풀 증설이 스레드 경합 상태 악화를 유발함을 입증하고 서버 자원에 맞게 커넥션 상한치를 오히려 하향 최적화했습니다.",
    metrics: [
      { label: "평균 응답시간 최적화", value: "310ms → 234ms" },
      { label: "95% 응답시간 안정화", value: "1,193ms → 880ms" },
      {
        label: "50개 증설 부작용 규명",
        value: "지연 시간 최대 4.5만 ms 역효과 입증",
      },
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
          "응답 지연 파악 후, 의도적으로 커넥션 풀을 50개로 폭증시켜 컨텍스트 스위칭 악화 지표를 검증했습니다.",
          "이를 바탕으로 동시 실행 스레드를 제어하기 위해 기본 풀(10개)을 6개로 과감히 축소 튜닝했습니다.",
          "단일 서버 내부 처리 최적화의 한계를 파악하고, 수평 확장 전략으로 의사결정 경계를 전환했습니다.",
        ],
      },
      {
        heading: "결과",
        paragraphs: [
          "커넥션을 늘리는 방식은 병목을 줄이기보다 동시 실행 경쟁을 키울 수 있음을 데이터로 확인했습니다. 6개 최적화를 통해 로컬 효율을 극대화한 뒤, 최종 개선 방향을 아키텍처 수평 확장으로 이어갔습니다.",
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
      "단일 캐시 인프라 장애 발생 시 데이터 성격별로 폴백 우회와 보관 재처리를 나누어 시스템 전체의 복원력을 높였습니다.",
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
