// RFC 7807 / RFC 9457 Problem Details for HTTP APIs (application/problem+json)
export interface ProblemDetailInvalidParam {
  name: string;
  reason: string;
}

export interface ProblemDetail {
  type: string;
  title: string;
  status?: number;
  detail: string;
  instance: string;
  invalidParams?: ProblemDetailInvalidParam[];
  timestamp: string;
}
