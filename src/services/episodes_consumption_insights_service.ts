import {
  ProducerMetrics,
  ProducerEpisodeMetrics,
  getProducerEpisodeMetricsByEmail,
  getProducerMetricsByEmail,
} from "./episodes_watching_progress_service";

export interface ConsumptionSummary {
  score: number;
  health: "excellent" | "good" | "regular" | "poor";
  message: string;
}

export interface ConsumptionInsight {
  type: "positive" | "warning" | "opportunity";
  title: string;
  description: string;
}

export interface ConsumptionRecommendation {
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
}

export interface EpisodeRanking {
  episodeId: string;
  title: string;
  completionRate: number;
  completions: number;
}

interface ProducerConsumptionContext {
  producerEmail: string;

  podcasts: ProducerMetrics[];

  episodes: ProducerEpisodeMetrics[];

  totalEpisodes: number;

  totalCompletions: number;

  averageCompletionRate: number;

  uniqueViewers: number;

  bestEpisode?: ProducerEpisodeMetrics;

  worstEpisode?: ProducerEpisodeMetrics;
}

export interface ProducerConsumptionInsights {

  generatedAt: string;

  summary: ConsumptionSummary;

  statistics: {

    podcasts: number;

    episodes: number;

    completions: number;

    uniqueViewers: number;

    averageCompletionRate: number;

  };

  ranking: {

    bestEpisodes: EpisodeRanking[];

    worstEpisodes: EpisodeRanking[];

  };

  insights: ConsumptionInsight[];

  recommendations: ConsumptionRecommendation[];

  executiveNarrative: string;

  analyticsContext: {

    hasManyEpisodes: boolean;

    hasExcellentRetention: boolean;

    hasLowRetention: boolean;

    growingAudience: boolean;

    bestEpisode?: ProducerEpisodeMetrics;

    worstEpisode?: ProducerEpisodeMetrics;
  };
}

export class EpisodesConsumptionInsightsService {

  private async buildContext(
    producerEmail: string,
  ): Promise<ProducerConsumptionContext> {

    const podcasts =
      await getProducerMetricsByEmail(
        producerEmail,
      );

    const episodes =
      await getProducerEpisodeMetricsByEmail(
        producerEmail,
      );

    const totalEpisodes =
      podcasts.reduce(
        (sum, podcast) =>
          sum + podcast.total_episodes,
        0,
      );

    const totalCompletions =
      podcasts.reduce(
        (sum, podcast) =>
          sum + podcast.total_completions,
        0,
      );

    const uniqueViewers =
      podcasts.reduce(
        (sum, podcast) =>
          sum + podcast.unique_viewers,
        0,
      );

    const averageCompletionRate =
      podcasts.length === 0
        ? 0
        : podcasts.reduce(
            (sum, podcast) =>
              sum + podcast.avg_completion_rate,
            0,
          ) / podcasts.length;

    const sortedEpisodes =
      [...episodes].sort(
        (a, b) =>
          b.completion_rate -
          a.completion_rate,
      );

    return {

      producerEmail,

      podcasts,

      episodes,

      totalEpisodes,

      totalCompletions,

      uniqueViewers,

      averageCompletionRate,

      bestEpisode: sortedEpisodes[0],

      worstEpisode:
        sortedEpisodes[
          sortedEpisodes.length - 1
        ],

    };

  }

  private generateSummary(
    context: ProducerConsumptionContext,
  ): ConsumptionSummary {

    const score =
      this.calculateHealthScore(context);

    if (score >= 90) {

      return {

        score,

        health: "excellent",

        message:
          "Excelente desempenho. Seus episódios apresentam uma retenção muito acima da média, indicando que seu conteúdo mantém os ouvintes engajados até o final.",

      };

    }

    if (score >= 75) {

      return {

        score,

        health: "good",

        message:
          "Seu conteúdo apresenta uma boa retenção. Existem oportunidades para aumentar ainda mais o consumo completo dos episódios.",

      };

    }

    if (score >= 50) {

      return {

        score,

        health: "regular",

        message:
          "Os episódios possuem uma retenção moderada. Vale analisar os episódios com menor desempenho para identificar oportunidades de melhoria.",

      };

    }

    return {

      score,

      health: "poor",

      message:
        "A retenção dos episódios está abaixo do esperado. Recomenda-se revisar formato, estrutura e frequência de publicação.",

    };

  }

  private calculateHealthScore(
    context: ProducerConsumptionContext,
  ): number {

    let score = 0;

    score +=
      context.averageCompletionRate * 0.70;

    score +=
      Math.min(
        context.totalCompletions / 20,
        20,
      );

    score +=
      Math.min(
        context.uniqueViewers / 10,
        10,
      );

    return Math.round(score);

  }
    private getBestEpisodes(
    context: ProducerConsumptionContext,
  ): EpisodeRanking[] {

    return [...context.episodes]
      .sort(
        (a, b) =>
          b.completion_rate - a.completion_rate,
      )
      .slice(0, 5)
      .map((episode) => ({
        episodeId: episode.episode_id,
        title: episode.episode_title,
        completionRate: episode.completion_rate,
        completions: episode.completions,
      }));
  }

  private getWorstEpisodes(
    context: ProducerConsumptionContext,
  ): EpisodeRanking[] {

    return [...context.episodes]
      .sort(
        (a, b) =>
          a.completion_rate - b.completion_rate,
      )
      .slice(0, 5)
      .map((episode) => ({
        episodeId: episode.episode_id,
        title: episode.episode_title,
        completionRate: episode.completion_rate,
        completions: episode.completions,
      }));
  }

  private generateInsights(
    context: ProducerConsumptionContext,
  ): ConsumptionInsight[] {

    const insights: ConsumptionInsight[] = [];

    if (context.averageCompletionRate >= 80) {

      insights.push({

        type: "positive",

        title: "Excelente retenção",

        description:
          "A média de conclusão dos episódios está acima de 80%, indicando que o conteúdo consegue manter a atenção da audiência durante praticamente toda a reprodução.",

      });

    } else if (context.averageCompletionRate >= 60) {

      insights.push({

        type: "positive",

        title: "Boa retenção",

        description:
          "A maioria dos episódios apresenta uma boa taxa de conclusão. Pequenos ajustes podem aumentar ainda mais o consumo completo.",

      });

    } else {

      insights.push({

        type: "warning",

        title: "Retenção abaixo do esperado",

        description:
          "Grande parte dos ouvintes interrompe os episódios antes da conclusão. Vale revisar o formato e comparar os episódios com melhor desempenho.",

      });

    }

    if (context.bestEpisode) {

      insights.push({

        type: "positive",

        title: "Melhor episódio",

        description:
          `"${context.bestEpisode.episode_title}" apresenta ${context.bestEpisode.completion_rate.toFixed(1)}% de conclusão. Ele pode servir como referência para novos conteúdos.`,

      });

    }

    if (
      context.worstEpisode &&
      context.bestEpisode &&
      context.bestEpisode.episode_id !==
        context.worstEpisode.episode_id
    ) {

      insights.push({

        type: "opportunity",

        title: "Oportunidade de melhoria",

        description:
          `"${context.worstEpisode.episode_title}" possui desempenho significativamente inferior aos demais. Comparar sua estrutura com os episódios de maior retenção pode revelar boas oportunidades.`,

      });

    }

    if (context.totalEpisodes < 5) {

      insights.push({

        type: "opportunity",

        title: "Poucos episódios publicados",

        description:
          "Ainda existe pouco histórico para análises mais profundas. Conforme novos episódios forem publicados, a plataforma fornecerá insights mais precisos.",

      });

    }

    return insights;

  }

  private generateRecommendations(
    context: ProducerConsumptionContext,
  ): ConsumptionRecommendation[] {

    const recommendations: ConsumptionRecommendation[] = [];

    if (context.averageCompletionRate < 60) {

      recommendations.push({

        priority: "high",

        title: "Melhorar retenção",

        description:
          "Analise principalmente a introdução dos episódios com menor conclusão. Os primeiros minutos costumam ser decisivos para manter a audiência.",

      });

    }

    if (context.totalEpisodes < 10) {

      recommendations.push({

        priority: "medium",

        title: "Expandir o catálogo",

        description:
          "Quanto maior a quantidade de episódios publicados, maior será a capacidade da plataforma identificar padrões de consumo e gerar recomendações mais inteligentes.",

      });

    }

    if (context.bestEpisode) {

      recommendations.push({

        priority: "medium",

        title: "Replicar conteúdos de sucesso",

        description:
          `Utilize "${context.bestEpisode.episode_title}" como referência para futuros episódios, observando tema, formato e duração.`,

      });

    }

    if (context.averageCompletionRate >= 80) {

      recommendations.push({

        priority: "low",

        title: "Manter consistência",

        description:
          "Os indicadores mostram que seu conteúdo está performando muito bem. Continue mantendo a frequência de publicação e monitore a evolução dos próximos episódios.",

      });

    }

    return recommendations;

  }
    /**
   * Constrói um contexto analítico simples.
   * Não utiliza LLM.
   * Apenas organiza informações que serão reutilizadas
   * pelo motor de insights.
   */
  private buildConsumptionContext(
    context: ProducerConsumptionContext,
  ) {

    return {

      hasManyEpisodes:
        context.totalEpisodes >= 20,

      hasExcellentRetention:
        context.averageCompletionRate >= 80,

      hasLowRetention:
        context.averageCompletionRate < 60,

      growingAudience:
        context.podcasts.some(
          p => p.last_30d_completions > p.last_7d_completions,
        ),

      bestEpisode:
        context.bestEpisode,

      worstEpisode:
        context.worstEpisode,

    };

  }

  /**
   * Gera uma narrativa executiva.
   */
  private buildExecutiveNarrative(
    context: ProducerConsumptionContext,
  ): string {

    const score =
      this.calculateHealthScore(context);

    if (score >= 90) {

      return "Seu catálogo demonstra um excelente nível de engajamento. Os episódios mantêm a audiência até o final e apresentam indicadores consistentes de consumo.";

    }

    if (score >= 75) {

      return "Seu conteúdo apresenta um bom desempenho geral. Alguns episódios já se destacam pela retenção e podem servir de referência para novas publicações.";

    }

    if (score >= 50) {

      return "O desempenho é consistente, mas ainda existem oportunidades para aumentar a retenção dos ouvintes durante os episódios.";

    }

    return "Os indicadores mostram uma oportunidade clara de evolução. Vale acompanhar os episódios com menor retenção e utilizar os melhores desempenhos como referência.";

  }

  /**
   * Método público final.
   */
  public async execute(
    producerEmail: string,
  ): Promise<ProducerConsumptionInsights> {

    const context =
      await this.buildContext(producerEmail);

    const analyticsContext =
      this.buildConsumptionContext(context);

    const insights =
      this.generateInsights(context);

    const recommendations =
      this.generateRecommendations(context);

    return {

      generatedAt: new Date().toISOString(),

      summary:
        this.generateSummary(context),

      statistics: {

        podcasts:
          context.podcasts.length,

        episodes:
          context.totalEpisodes,

        completions:
          context.totalCompletions,

        uniqueViewers:
          context.uniqueViewers,

        averageCompletionRate:
          Number(
            context.averageCompletionRate.toFixed(2),
          ),

      },

      ranking: {

        bestEpisodes:
          this.getBestEpisodes(context),

        worstEpisodes:
          this.getWorstEpisodes(context),

      },

      insights,

      recommendations,

      executiveNarrative:
        this.buildExecutiveNarrative(context),

      analyticsContext,

    };

  }

}

export const
episodesConsumptionInsightsService =
new EpisodesConsumptionInsightsService();