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
          "Excellent performance. Your episodes have retention well above average, showing your content keeps viewers engaged until the end.",

      };

    }

    if (score >= 75) {

      return {

        score,

        health: "good",

        message:
          "Your content has good retention. There are opportunities to further increase full episode consumption.",

      };

    }

    if (score >= 50) {

      return {

        score,

        health: "regular",

        message:
          "Episodes have moderate retention. Review the lowest-performing episodes to identify improvement opportunities.",

      };

    }

    return {

      score,

      health: "poor",

message:
          "Episode retention is below expectations. Review format, structure, and publishing frequency.",

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

        title: "Excellent retention",

        description:
          "Average episode completion is above 80%, indicating content keeps the audience engaged through most of the playback.",

      });

    } else if (context.averageCompletionRate >= 60) {

      insights.push({

        type: "positive",

        title: "Good retention",

        description:
          "Most episodes have a good completion rate. Small tweaks could increase full consumption even further.",

      });

    } else {

      insights.push({

        type: "warning",

        title: "Retention below expectations",

        description:
          "Most viewers stop episodes before completion. Review the format and compare with better-performing episodes.",

      });

    }

    if (context.bestEpisode) {

      insights.push({

        type: "positive",

        title: "Best episode",

        description:
          `"${context.bestEpisode.episode_title}" has ${(context.bestEpisode.completion_rate ?? 0).toFixed(1)}% completion. It can serve as a reference for new content.`,

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

        title: "Improvement opportunity",

        description:
          `"${context.worstEpisode.episode_title}" performs significantly worse than others. Comparing its structure to higher-retention episodes may uncover good opportunities.`,

      });

    }

    if (context.totalEpisodes < 5) {

      insights.push({

        type: "opportunity",

        title: "Few published episodes",

        description:
          "Not enough history for deeper analysis. As new episodes are published, the platform will provide more accurate insights.",

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

        title: "Improve retention",

        description:
          "Review the introduction of episodes with the lowest completion. The first few minutes are often decisive for keeping the audience.",

      });

    }

    if (context.totalEpisodes < 10) {

      recommendations.push({

        priority: "medium",

        title: "Expand catalog",

        description:
          "The more episodes published, the better the platform can identify consumption patterns and generate smarter recommendations.",

      });

    }

    if (context.bestEpisode) {

      recommendations.push({

        priority: "medium",

        title: "Replicate successful content",

        description:
          `Use "${context.bestEpisode.episode_title}" as a reference for future episodes, considering topic, format, and duration.`,

      });

    }

    if (context.averageCompletionRate >= 80) {

      recommendations.push({

        priority: "low",

        title: "Maintain consistency",

        description:
          "Your metrics show content is performing very well. Keep up the publishing frequency and monitor evolution of future episodes.",

      });

    }

    return recommendations;

  }
/**
   * Builds a simple analytical context.
   * Does not use LLM.
   * Only organizes information to be reused
   * by the insights engine.
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
   * Builds an executive narrative.
   */
  private buildExecutiveNarrative(
    context: ProducerConsumptionContext,
  ): string {

    const score =
      this.calculateHealthScore(context);

    if (score >= 90) {

      return "Your catalog shows excellent engagement levels. Episodes keep the audience watching until the end with consistent consumption metrics.";

    }

    if (score >= 75) {

      return "Your content shows good overall performance. Some episodes already stand out for retention and can serve as references for new publications.";

    }

    if (score >= 50) {

      return "Performance is consistent, but there are still opportunities to increase viewer retention during episodes.";

    }

    return "Metrics show a clear opportunity for improvement. Track episodes with lower retention and use the best performers as a reference.";

  }

/**
   * Final public method.
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
          context.averageCompletionRate
            ? Number(context.averageCompletionRate.toFixed(2))
            : 0,

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