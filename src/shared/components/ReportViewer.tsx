import React from 'react';
import type { EvaluationReport } from '../../lib/evaluatorClient';

type Level = 'ludic' | 'general' | 'clinical';

interface Props {
  report: EvaluationReport;
  level: Level;
  reportUrl?: string | null;
}

export const ReportViewer: React.FC<Props> = ({ report, level, reportUrl }) => {
  return (
    <div>
      {level === 'ludic' && (
        <section>
          <p>{report.ludic.emoji} {report.ludic.label}</p>
          <p>Score: {report.ludic.score}</p>
        </section>
      )}
      {level === 'general' && (
        <section>
          <p>{report.general.summary}</p>
          <ul>{report.general.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          <ul>{report.general.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
          <p>{report.general.recommendation}</p>
        </section>
      )}
      {level === 'clinical' && (
        <section>
          <ul>{report.clinical.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
          <ul>{report.clinical.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
          <p>{report.clinical.recommendation}</p>
          <blockquote>{report.clinical.clinicalNote}</blockquote>
          {reportUrl && (
            <a href={reportUrl} target="_blank" rel="noopener noreferrer">
              Baixar laudo (.md)
            </a>
          )}
        </section>
      )}
    </div>
  );
};
