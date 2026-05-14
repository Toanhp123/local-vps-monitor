# VPS Monitor - Giải thích dự án

Tài liệu này dùng để đọc lại ý tưởng, kiến trúc, luồng hoạt động và cách diễn đạt dự án `VPS Monitor` khi đưa vào CV hoặc khi phỏng vấn.

## 1. Vấn đề cần giải quyết

Khi một developer deploy nhiều ứng dụng lên nhiều VPS khác nhau, việc kiểm tra thủ công từng server sẽ mất thời gian và dễ bỏ sót lỗi.

Ví dụ:

- Một số app chạy bằng Docker.
- Một số app chạy bằng PM2.
- App nằm rải rác trên nhiều VPS.
- Khi có lỗi, phải SSH vào từng VPS để xem container hoặc process nào đang down.

`VPS Monitor` giải quyết bài toán này bằng cách tạo một dashboard local để xem trạng thái tất cả VPS và ứng dụng từ một màn hình duy nhất.

## 2. Hướng kiến trúc hiện tại: Local SSH mode

Hướng chính hiện tại là **Local SSH mode**.

Người dùng clone project từ GitHub, chạy dashboard trên máy cá nhân, sau đó dashboard backend kết nối SSH từ localhost tới các VPS của chính họ.

Luồng tổng quan:

```text
React Dashboard ---> Local Express API ---> SSH ---> VPS 1
                                     |----> SSH ---> VPS 2
                                     |----> SSH ---> VPS 3

Local Express API ---> WebSocket /ws ---> React Dashboard
```

Điểm quan trọng:

- Dashboard chỉ bind mặc định vào `127.0.0.1`, không public ra Internet.
- API và WebSocket chặn `Host` và `Origin` không phải local để giảm rủi ro website lạ gọi vào dashboard localhost.
- Dữ liệu monitor được lưu ở máy local trong thư mục `data/`.
- Danh sách VPS SSH được lưu local trong `data/ssh-targets.json`.
- Ứng dụng không lưu password SSH.
- Ứng dụng không lưu nội dung private key, chỉ lưu đường dẫn tới file key trên máy người dùng.
- SSH host key được kiểm tra qua `~/.ssh/known_hosts`, tránh việc app tự động tin một server SSH chưa xác thực.
- Backend local dùng SSH key để kết nối outbound tới VPS.

Lý do chọn hướng này: nếu public tool cho người khác dùng, họ chỉ cần chạy localhost nên sẽ yên tâm hơn. Dữ liệu server, danh sách app và thông tin SSH không bị gửi về server của bên thứ ba.

## 3. Cách Local SSH mode hoạt động

Người dùng thêm một SSH target gồm:

- Tên hiển thị.
- IP hoặc hostname của VPS.
- SSH port.
- SSH username.
- Đường dẫn private key trên máy local.

Khi bấm `Scan` hoặc `Scan all`, local backend sẽ:

1. Đọc private key từ đường dẫn local.
2. Kiểm tra SSH host key với `~/.ssh/known_hosts`.
3. Mở SSH connection tới VPS.
4. Chạy các lệnh read-only để lấy thông tin host, Docker và PM2.
5. Chuyển dữ liệu thu được thành `ServerSnapshotPayload`.
6. Gọi lại `MonitorOverviewService.ingestSnapshot()` để cập nhật state nội bộ.
7. Lưu trạng thái mới nhất vào `monitor-state.json`.
8. Bắn overview mới xuống React dashboard qua WebSocket.

Điểm hay là phần dashboard, offline detection, summary và WebSocket không cần viết lại. SSH scanner chỉ đóng vai trò một nguồn dữ liệu mới.

Ngoài thao tác scan thủ công, backend còn có auto scan loop theo `AUTO_SCAN_INTERVAL_MS`. Nhờ vậy WebSocket không chỉ để trang trí: khi backend tự scan định kỳ và có snapshot mới, dashboard nhận update realtime mà người dùng không cần reload hoặc bấm refresh. Số SSH scan chạy song song được giới hạn bằng `SSH_SCAN_CONCURRENCY` để tránh mở quá nhiều connection cùng lúc.

## 4. Vì sao cách này bảo mật hơn cho người dùng GitHub

Với một tool public trên GitHub, người dùng thường ngại nhập thông tin server vào một hệ thống hosted sẵn. Vì vậy hướng local-first hợp lý hơn:

- Không cần tạo tài khoản.
- Không cần cloud server trung gian.
- Không cần Cloudflare Tunnel.
- Không cần mở dashboard ra public Internet.
- Không có dữ liệu monitor gửi về tác giả tool.
- Không có agent mode và không có public ingest endpoint để VPS gửi dữ liệu vào dashboard.
- SSH key vẫn nằm trên máy người dùng.
- Giảm rủi ro DNS rebinding hoặc cross-origin request nhờ kiểm tra `Host`/`Origin` ở backend.

Thiết kế hiện tại cố tình không hỗ trợ lưu password SSH. Nếu cần đăng nhập bằng password lần đầu, người dùng nên tự tạo SSH key và copy public key lên VPS, sau đó dashboard chỉ dùng key.

## 5. Các lệnh remote được scan

Phần SSH scanner lấy host metrics từ Linux:

- `hostname`
- `uname`
- `/proc/uptime`
- `/proc/loadavg`
- `/proc/meminfo`
- `nproc`

Phần Docker:

- `docker ps -a --format '{{json .}}'`
- `docker stats --no-stream --format '{{json .}}'`
- `docker inspect --format '{{json .}}'`

Phần PM2:

- `pm2 jlist`

Nếu VPS không cài Docker hoặc PM2 thì scanner không coi đó là lỗi. Runtime nào không tồn tại sẽ trả về danh sách app rỗng.

## 6. Realtime update

Sau mỗi lần scan thành công, server local không bắt client reload trang. Thay vào đó server broadcast overview mới xuống dashboard bằng WebSocket:

```text
SSH scan ---> MonitorOverviewService ---> WebSocket /ws ---> React Dashboard
```

Dashboard cũng có fallback bằng HTTP polling nếu WebSocket bị mất kết nối.

## 7. Kiến trúc backend MVC đơn giản

Server dùng Express và được tách theo kiểu MVC-style:

```text
src/server
├── index.ts                 # bootstrap HTTP server
├── app.ts                   # cấu hình Express app
├── config.ts                # cấu hình môi trường
├── routes                   # khai báo endpoint
├── controllers              # xử lý request/response
├── services                 # use case, business logic
├── models                   # đọc/ghi JSON state
├── domain                   # logic thuần để tính overview, health và restart
├── integrations             # adapter bên ngoài như SSH command runner và collectors
├── lib                      # helper nhỏ dùng trong backend
├── realtime                 # WebSocket gateway
└── validators               # schema validate payload
```

Lý do chọn MVC đơn giản:

- Backend hiện tại ít endpoint và CRUD không nhiều.
- Dễ đọc, dễ giải thích khi đưa vào CV.
- Đủ tách trách nhiệm giữa route, controller, service và storage.
- Không over-engineering khi domain vẫn còn nhỏ.

Các service chính:

- `MonitorOverviewService`: ingest server snapshot, lấy overview, notify realtime listener.
- `SshTargetConfigService`: quản lý CRUD cấu hình SSH target.
- `SshScanService`: quản lý luồng scan VPS qua SSH và chuyển kết quả thành server snapshot.
- `HealthService`: trả thông tin health của local API.

Các model chính:

- `MonitorStateStore`: lưu trạng thái server/app mới nhất.
- `SshTargetConfigStore`: lưu danh sách SSH target local, không lưu password.

Các file trong `domain` chứa logic thuần không phụ thuộc Express hoặc filesystem. Ví dụ `monitorOverviewProjector` chịu trách nhiệm tính offline status, summary và Docker observed restart count.

Các file trong `integrations/ssh` không được coi là service nghiệp vụ. Chúng là adapter kỹ thuật để kết nối SSH, chạy command và parse output từ Docker/PM2/Linux. Cách tách này giúp service giữ vai trò điều phối use case, còn chi tiết hạ tầng nằm riêng.

## 8. Kiến trúc frontend FSD

Client dùng React + TypeScript + Tailwind CSS và tổ chức theo Feature-Sliced Design ở mức vừa đủ:

```text
src/client
├── app                      # bootstrap app và global styles
├── pages                    # màn hình cấp page
├── widgets                  # các khối UI lớn
├── entities                 # UI theo domain server/application
└── shared                   # API client, helper format, UI dùng chung
```

Ví dụ:

- `pages/dashboard/model/useDashboardOverview.ts`: quản lý overview và WebSocket.
- `pages/dashboard/model/useSshTargetManager.ts`: quản lý danh sách SSH target và thao tác scan.
- `widgets/sshTargets/ui/SshTargetManagerPanel.tsx`: form thêm VPS và nút scan.
- `entities/server/ui/ServerPanel.tsx`: hiển thị một VPS.
- `entities/application/ui/ApplicationTable.tsx`: hiển thị Docker/PM2 apps.

Lý do chọn FSD:

- Tách page state, widget, entity và shared utilities rõ ràng.
- Dễ mở rộng thêm trang alerts, history hoặc settings.
- Tránh dồn toàn bộ dashboard vào một file `App.tsx`.
- Thể hiện được tư duy cấu trúc frontend khi đưa vào CV.

## 9. Vì sao không dùng agent mode

Project không dùng agent mode vì mục tiêu chính là local-first và giảm bề mặt rủi ro bảo mật.

```text
React Dashboard ---> Local API ---> SSH outbound ---> VPS
```

Nếu dùng agent mode, người dùng thường phải self-host dashboard, mở endpoint nhận dữ liệu hoặc cấu hình tunnel để VPS gửi dữ liệu về. Với một tool public trên GitHub, cách đó dễ khiến người dùng lo ngại dữ liệu server bị gửi ra ngoài.

Vì vậy project chọn SSH outbound từ localhost:

- Người dùng không cần deploy dashboard.
- Không cần cài process phụ trên VPS.
- Không cần token ingest public.
- Không có endpoint dạng `POST /api/ingest/heartbeat`.
- Dữ liệu monitor chỉ nằm trên máy local.

## 10. Cách xác định health status

Hệ thống có các status chính:

- `healthy`: app đang chạy bình thường.
- `warning`: app có dấu hiệu bất thường, ví dụ Docker unhealthy hoặc PM2 đang launching/stopping.
- `down`: app/server bị stop, exited, errored hoặc offline.
- `unknown`: không đủ dữ liệu để kết luận.

Docker health được suy ra từ `docker ps`, `docker stats` và `docker inspect`.

Docker restart count lấy từ `RestartCount` của `docker inspect`, đồng thời server còn so sánh `State.StartedAt` giữa các lần scan. Lý do là khi restart thủ công bằng `docker restart`, Docker có thể vẫn giữ `RestartCount = 0`, nhưng `StartedAt` sẽ đổi.

PM2 health và restart count lấy từ `pm2 jlist`.

## 11. Điểm kỹ thuật nổi bật để đưa vào CV

Có thể nhấn mạnh các ý sau:

- Xây dựng local-first VPS monitoring dashboard bằng React, TypeScript, Node.js và Express.
- Thiết kế backend MVC-style đơn giản, gồm controllers, services, models, validators và WebSocket gateway.
- Tích hợp SSH scanner để collect host metrics, Docker containers và PM2 processes từ nhiều VPS.
- Không lưu SSH password; chỉ lưu local private key path để giảm rủi ro lộ credential.
- Chuyển kết quả SSH scan thành server snapshot để tái sử dụng monitor pipeline nội bộ.
- Broadcast realtime overview xuống dashboard bằng WebSocket sau mỗi lần scan.
- Refactor frontend theo Feature-Sliced Design, tách pages, widgets, entities và shared layer.
- Dùng Tailwind CSS để colocate styling theo component.
- Loại bỏ agent mode và public ingest endpoint để giữ đúng định hướng local-only.
- Phát hiện Docker manual restart bằng cách so sánh `State.StartedAt` giữa các lần scan.

## 12. Cách viết trong CV

Bản ngắn:

```text
Built a local-first VPS monitoring dashboard to track Docker containers and PM2 applications across multiple servers through SSH, without exposing the dashboard publicly or storing SSH passwords.
```

Bản chi tiết hơn:

```text
Developed a local-first VPS monitoring system using React, TypeScript, Node.js, and Express.js. Implemented an SSH-based scanner that connects from the user's localhost to remote VPS instances, collects host metrics, Docker container stats, and PM2 process status, then streams real-time overview updates to the dashboard through WebSocket.
```

Dạng bullet points:

```text
- Designed a local-first monitoring architecture where the dashboard runs on localhost and scans VPS instances through outbound SSH.
- Implemented an Express.js MVC-style backend with controllers, services, models, validators, and WebSocket broadcasting.
- Built an SSH scanner for collecting Linux host metrics, Docker container status, and PM2 process data.
- Avoided storing SSH passwords; persisted only local private key paths and monitor state in local JSON files.
- Reused an internal snapshot ingestion pipeline so SSH scan results update the same dashboard flow.
- Developed a React dashboard using Feature-Sliced Design and Tailwind CSS to visualize VPS health, runtime status, CPU, memory, uptime, and restart counts.
- Added WebSocket updates with reconnect and HTTP polling fallback for smoother realtime monitoring.
```

## 13. Hướng mở rộng

Các hướng có thể phát triển tiếp:

- Alert qua Telegram, Discord hoặc Slack khi app down.
- Lưu lịch sử metrics theo thời gian.
- Biểu đồ CPU/RAM theo từng VPS.
- Import/export danh sách SSH targets.
- Mã hoá file cấu hình local bằng passphrase của người dùng.
- Hỗ trợ ssh-agent thay vì đọc private key file trực tiếp.
- Group app theo project bằng Docker labels.
- Thêm command runner read-only có audit log.
- Dùng SQLite thay cho JSON file khi dữ liệu lớn hơn.
