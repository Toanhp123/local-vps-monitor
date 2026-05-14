# VPS Monitor - Giải thích dự án

Tài liệu này dùng để đọc lại ý tưởng, kiến trúc, luồng hoạt động và cách diễn đạt dự án `VPS Monitor` khi đưa vào CV hoặc khi phỏng vấn.

## 1. Vấn đề cần giải quyết

Khi một developer deploy nhiều ứng dụng lên nhiều VPS khác nhau, việc kiểm tra thủ công từng server sẽ mất thời gian và dễ bỏ sót lỗi.

Ví dụ:

- Một số app chạy bằng Docker.
- Một số app chạy bằng PM2.
- App nằm rải rác trên 3-4 VPS.
- Khi có lỗi, phải SSH vào từng VPS để xem container hoặc process nào đang down.

`VPS Monitor` giải quyết bài toán này bằng cách tạo một dashboard trung tâm, nơi có thể xem tình trạng tất cả VPS và app từ một màn hình duy nhất.

## 2. Ý tưởng tổng quan

Hệ thống gồm 2 thành phần chính:

- Central Dashboard: server trung tâm dùng để nhận dữ liệu, tổng hợp trạng thái và hiển thị UI.
- VPS Agent: process nhỏ cài trên từng VPS để tự động collect thông tin và gửi về dashboard.

Luồng tổng quan:

```text
VPS 1 Agent \
VPS 2 Agent  +--> Central API ---> React Dashboard
VPS 3 Agent /
```

Đây là push-based monitoring architecture. Nghĩa là mỗi VPS chủ động gửi heartbeat về server trung tâm. Server trung tâm không cần SSH vào VPS và không cần lưu SSH key.

Trong phiên bản hiện tại, agent vẫn gửi dữ liệu lên server bằng HTTP heartbeat:

```text
VPS Agent ---> HTTP POST /api/ingest/heartbeat ---> Central API
```

Sau khi nhận heartbeat, server bắn dữ liệu mới xuống dashboard bằng WebSocket:

```text
Central API ---> WebSocket /ws ---> React Dashboard
```

Như vậy luồng realtime hiện tại là:

```text
VPS Agent ---> HTTP heartbeat ---> Central API ---> WebSocket event ---> React Dashboard
```

Dashboard vẫn có thể gọi `GET /api/overview` khi load lần đầu, khi bấm refresh thủ công hoặc khi WebSocket bị mất kết nối. Nhưng luồng cập nhật chính là server push qua WebSocket.

## 3. Cách agent hoạt động

Agent là một Node.js process chạy trên từng VPS.

Mỗi chu kỳ, agent sẽ:

1. Lấy thông tin host:
   - hostname
   - platform
   - CPU cores
   - memory total/free
   - uptime
   - load average

2. Lấy thông tin Docker:
   - container name
   - image
   - status
   - health
   - CPU usage
   - memory usage
   - ports

3. Lấy thông tin PM2:
   - process name
   - status
   - CPU usage
   - memory usage
   - restart count
   - uptime

4. Tạo heartbeat payload.

5. Gửi heartbeat lên central server qua HTTP API:

```text
POST /api/ingest/heartbeat
```

Heartbeat được gửi kèm token:

```text
Authorization: Bearer <AGENT_TOKEN>
```

Điều này giúp server chỉ nhận dữ liệu từ agent hợp lệ.

Lưu ý: WebSocket hiện được dùng ở chiều server xuống dashboard. Agent vẫn dùng HTTP POST theo chu kỳ để gửi heartbeat lên server. Cách này phù hợp vì agent chỉ cần gửi snapshot định kỳ, còn dashboard cần nhận update ngay khi server có dữ liệu mới.

## 4. Cách central server hoạt động

Central server là một Express.js API.

Server có các nhiệm vụ:

- Nhận heartbeat từ các VPS agent.
- Validate payload bằng schema.
- Kiểm tra token xác thực.
- Lưu trạng thái mới nhất của từng VPS.
- Tổng hợp overview cho dashboard.
- Đánh dấu VPS offline nếu quá một khoảng thời gian không có heartbeat.

API chính:

```text
POST /api/ingest/heartbeat
GET /api/overview
GET /api/health
WS /ws
```

Trong MVP hiện tại, dữ liệu được lưu bằng JSON file. Cách này đơn giản, dễ deploy và đủ cho phiên bản demo/CV. Nếu cần production hơn, có thể nâng cấp sang SQLite, PostgreSQL hoặc time-series database.

Server được tổ chức theo kiến trúc MVC-style đơn giản:

```text
src/server
├── index.ts                 # bootstrap server
├── app.ts                   # cấu hình Express app
├── config.ts                # cấu hình môi trường
├── routes                   # khai báo HTTP routes
├── controllers              # xử lý request/response
├── services                 # logic nghiệp vụ/use case
├── models                   # model lưu trữ trạng thái
├── realtime                 # WebSocket gateway bắn update xuống dashboard
└── validators               # schema validate payload
```

Với backend API, phần View không nằm trong Express server mà nằm ở React dashboard. Vì vậy server dùng cách tách MVC-style:

- Routes định nghĩa endpoint.
- Controllers nhận request, validate dữ liệu và trả response.
- Services chứa use case của ứng dụng, ví dụ ingest heartbeat hoặc lấy overview.
- Models/Store chịu trách nhiệm lưu và đọc trạng thái monitor.
- Realtime gateway giữ WebSocket connection và broadcast overview mới cho dashboard.
- Validators chứa schema kiểm tra payload.

Lý do chọn MVC đơn giản:

- Backend hiện tại ít endpoint và CRUD không nhiều.
- Dễ đọc, dễ giải thích khi đưa vào CV.
- Đủ tách trách nhiệm giữa route, controller, logic và storage.
- Không bị over-engineering như Clean Architecture khi domain vẫn còn nhỏ.

## 5. Cách dashboard hoạt động

Dashboard được viết bằng React + TypeScript.

Client được tổ chức theo Feature-Sliced Design ở mức vừa đủ và dùng Tailwind CSS để style UI:

```text
src/client
├── app                      # bootstrap app và global styles
├── pages                    # màn hình cấp page
├── widgets                  # các khu vực lớn của dashboard
├── entities                 # UI theo domain server/application
└── shared                   # API client, helper format, UI dùng chung
```

Lý do chọn FSD cho client:

- Tách rõ page state, UI widget, entity UI và helper dùng chung.
- Dễ mở rộng khi dashboard có thêm trang như alerts, history hoặc settings.
- Tránh để toàn bộ dashboard nằm trong một file `App.tsx` quá lớn.
- Phù hợp để thể hiện cấu trúc frontend nghiêm túc hơn trong CV.

Lý do chuyển sang Tailwind:

- Không còn dồn toàn bộ CSS vào một file global lớn.
- Style của component nằm gần component, dễ đọc hơn khi theo FSD.
- Giảm việc đặt tên class thủ công như `server-panel`, `stats-grid`, `app-table`.
- Dễ chỉnh responsive trực tiếp bằng utility classes như `max-md:grid-cols-1`.

Khi load lần đầu, dashboard gọi API:

```text
GET /api/overview
```

Sau đó dashboard mở WebSocket tới server:

```text
ws://server-host/ws
```

Khi server nhận heartbeat mới từ agent, server broadcast message `overview.updated` xuống tất cả dashboard đang kết nối. Client nhận message này và cập nhật UI ngay.

Server cũng bắn overview định kỳ qua WebSocket để dashboard cập nhật trạng thái offline timeout, kể cả khi không có heartbeat mới.

Phần WebSocket ở client được xử lý mượt hơn bằng các cơ chế:

- Tự reconnect khi WebSocket bị đóng.
- Exponential backoff để tránh reconnect quá dày khi server đang lỗi.
- Stale socket detection: nếu socket vẫn mở nhưng quá lâu không nhận message thì chủ động reconnect.
- HTTP polling fallback khi WebSocket chưa kết nối lại được.
- Trạng thái kết nối rõ ràng trên UI: `Live`, `Connecting`, `Reconnecting`, `Polling fallback`.

Dashboard hiển thị:

- Tổng số VPS.
- Số VPS đang online.
- Tổng số app.
- Số app healthy/warning/down.
- Thông tin CPU, RAM, uptime của từng VPS.
- Danh sách Docker containers và PM2 processes.
- Runtime type của từng app.
- Status và health của từng app.

Nếu một VPS không gửi heartbeat trong thời gian cấu hình, dashboard sẽ coi VPS đó là offline.

Nếu WebSocket bị mất kết nối, dashboard chuyển sang fallback bằng HTTP polling để vẫn có dữ liệu.

## 6. Cách xác định health status

Hệ thống gồm các status chính:

- `healthy`: app đang chạy bình thường.
- `warning`: app có dấu hiệu bất thường, ví dụ Docker unhealthy hoặc process đang launching/stopping.
- `down`: app/server bị stop, exited, errored hoặc offline.
- `unknown`: không đủ dữ liệu để kết luận.

Docker health được suy ra từ `docker ps` và `docker stats`.

PM2 health được suy ra từ `pm2 jlist`.

## 7. Lý do chọn agent-based architecture

Có hai cách phổ biến để monitor VPS:

- Pull-based: server trung tâm SSH hoặc gọi API vào từng VPS.
- Push-based: mỗi VPS chạy agent và tự gửi dữ liệu về server trung tâm.

Project này chọn push-based vì:

- Central server không cần lưu SSH key.
- VPS có thể nằm sau firewall/NAT miễn là gọi được ra ngoài.
- Dễ thêm server mới: chỉ cần cài agent và token.
- Giảm rủi ro bảo mật so với việc server trung tâm có quyền SSH vào tất cả VPS.
- Phù hợp với bài toán monitor nhiều server nhỏ của developer.

## 8. Tech stack

Project sử dụng:

- React
- TypeScript
- Tailwind CSS
- Node.js
- Express.js
- Docker
- PM2
- systemd
- Vite
- WebSocket
- Zod

## 9. Điểm kỹ thuật nổi bật

Những điểm có thể nói trong CV/phỏng vấn:

- Thiết kế hệ thống monitor nhiều VPS bằng agent-based architecture.
- Xây dựng agent để collect Docker, PM2 và host metrics.
- Xây dựng API nhận heartbeat có xác thực bằng bearer token.
- Tổng hợp health status của server và application runtime.
- Phát hiện server offline dựa trên heartbeat timeout.
- Tạo dashboard React để quan sát tình trạng nhiều app từ một nơi.
- Refactor client theo Feature-Sliced Design để tách page, widgets, entities và shared utilities.
- Thêm WebSocket để server push overview mới xuống dashboard theo thời gian thực.
- Tối ưu WebSocket client với reconnect backoff, stale detection và polling fallback.
- Hỗ trợ deploy central dashboard bằng Docker Compose.
- Hỗ trợ chạy agent như background service bằng systemd.

## 10. Cách viết trong CV

Bản ngắn gọn:

```text
Built a centralized VPS monitoring dashboard to track Docker containers and PM2 applications across multiple servers without manually SSH-ing into each machine.
```

Bản chi tiết hơn:

```text
Developed a centralized VPS monitoring system using React, TypeScript, Node.js, and Express.js. Built a lightweight agent installed on each VPS to collect host metrics, Docker container stats, and PM2 process status, then push authenticated heartbeat data to a central API. Added WebSocket broadcasting so the React dashboard receives real-time overview updates and offline detection changes.
```

Dạng bullet points:

```text
- Designed a push-based monitoring architecture with lightweight agents installed on each VPS.
- Implemented a Node.js agent to collect host metrics, Docker container stats, and PM2 process status.
- Built an Express.js API to receive authenticated heartbeat data and aggregate server/application health.
- Developed a React dashboard to visualize server availability, app health, CPU/memory usage, uptime, and runtime status.
- Refactored the frontend using a lightweight Feature-Sliced Design structure with pages, widgets, entities, and shared layers.
- Added offline detection based on heartbeat timeout and health classification for Docker/PM2 workloads.
- Containerized the central dashboard with Docker Compose and provided a systemd service setup for VPS agents.
- Implemented WebSocket broadcasting to push live overview updates from the server to connected dashboard clients.
- Improved WebSocket reliability with reconnect backoff, stale connection detection, and HTTP polling fallback.
```

## 11. Giải thích ngắn khi phỏng vấn

Nếu được hỏi về project, có thể trả lời:

```text
I built this project because I often deploy multiple applications across different VPS instances, some running in Docker and some managed by PM2. Instead of SSH-ing into each server manually, I created a lightweight agent that runs on every VPS, collects host, Docker, and PM2 metrics, and pushes heartbeat data to a central Express API. The server aggregates the latest state and broadcasts overview updates to the React dashboard through WebSocket, so connected clients can see health changes in real time.
```

Ý chính cần nhấn mạnh:

- Đây là hệ thống monitor nhiều VPS từ một dashboard trung tâm.
- Mỗi VPS chạy một agent nhỏ để gửi heartbeat.
- Server trung tâm không cần SSH vào VPS.
- Hệ thống theo dõi được cả Docker container và PM2 process.
- Có cơ chế phát hiện VPS offline dựa trên timeout.
- Agent gửi heartbeat bằng HTTP, còn server push update realtime xuống dashboard bằng WebSocket.

## 12. Hướng mở rộng

Nếu tiếp tục phát triển, project có thể thêm:

- Alert qua Telegram/Discord/Slack khi app down.
- Lưu lịch sử metrics theo thời gian.
- Biểu đồ CPU/RAM.
- Login cho dashboard.
- Multi-user và role-based access control.
- Auto-discovery Docker labels để group app theo project.
- Deploy agent bằng install script một lệnh.
- Lưu dữ liệu bằng PostgreSQL hoặc SQLite.
