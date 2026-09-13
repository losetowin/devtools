FROM nginx:alpine

LABEL org.opencontainers.image.title="Emoji Hub" \
      org.opencontainers.image.description="全量 Emoji 检索与复制静态站点"

# 复制站点文件到 nginx 默认目录
COPY . /usr/share/nginx/html
# 缓存策略：HTML/JS/CSS 实时校验，数据文件 7 天缓存
COPY nginx.conf /etc/nginx/conf.d/default.conf
# P0 SEO：旧码点页 301 映射文件
COPY emoji-redirects.map /etc/nginx/conf.d/emoji-redirects.map

# 确保所有文件对 nginx 进程可读（避免宿主机 600 权限导致 403）
RUN chmod -R a+r /usr/share/nginx/html && find /usr/share/nginx/html -type d -exec chmod a+x {} \;

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
