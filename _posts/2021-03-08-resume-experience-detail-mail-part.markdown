---
layout: post
title:  "2012.01~2020.04 메일개발파트 경험 정리. 다음메일, 카카오메일"
date:   2021-03-08 20:06:27 +0900
categories: jekyll update
---

> 문서는 꾸준히 업데이트 됩니다.

## 요약
* 다음메일 
  * 수발신 서버 (SMTP 서버)
  * 스마트워크 (도메인 메일 서비스)
  * 프리미엄메일 (유료 메일 서비스)
  * 마이그레이션
    * DB Oracle -> MySQL 마이그레이션 작업
    * OS 버전 변경 대응, Java 버전 변경, 인프라 변경 (PM -> VMware, OpenStack)
    * JUnit 3 -> 4
    * Ant -> Gradle
    * Java 5 -> 8
  * 기타
    * 메일 수신 이벤트 서버 - 수신된 메일 정보를 검색 인덱싱 서버, 사용자 앱 푸시 알림 등으로 전달
* 카카오메일
  * 오픈
  
## 연도별 정리
* 2020~현재
  * My 구독 서비스 개발/운영 - SpringBoot, Kafka, MySQL
* 다음메일 서비스. 하루 1억건이 넘는 메일 수발신 처리
* 2019
  * 카카오메일 오픈 - C로 된 레거시 메일에 cmake적용, 외부메일발송서버 sendmail을 java서버로 변경
  * DB 이관. Oracle -> MySQL
* 2016 로그 수집 시스템 - 수발신 로그 수집 및 조회 툴 - Logstash, Hbase, NodsJS
  * 메일-CRMS 연동 프로젝트 java로 재개발
* 2015
  * 회원시스템과 메일시스템 의존성 제거 프로젝트 - C
  * 회원 가입/탈퇴 처리 시스템 - SpringBoot, RabbitMQ
  * 그룹메일
  * 버전업. junit 3 -> 4, ant -> gradle, java 5 -> 8
  * 모니터링 강화
* 2014 EMS 대량 메일 발송 시스템, 통합사내메일 프로젝트
* 2013 스마트워크트, 메일-CRMS 연동 프로젝트 python으로 재개발
* 2012 사내 도서관 시스템 - Spring?, MySQL?, Barcode
* 유지보수/개선
  * 프리미엄메일
  * SMTP 서버
  * LMTP 서버
  * 인프라 마이그레이션
  * Java 버전 업 대응, OS 버전업 대응
  * 운영툴 개발
* Java, C, Perl, MySQL, Linux
