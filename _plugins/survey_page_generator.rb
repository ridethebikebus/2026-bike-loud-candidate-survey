require 'cgi'
require 'jekyll'

module BikeloudSurvey
  # Generates /candidates/<slug>/ for each entry in _data/candidates.yml and
  # /questions/<n>/ for each entry in _data/questions.yml, so the responses
  # live in data files rather than one page file each.
  class SurveyPageGenerator < Jekyll::Generator
    def generate(site)
      candidates = site.data['candidates'] || []
      questions = site.data['questions'] || []
      candidates.each_with_index do |c, i|
        add_page(site, "candidates/#{c['slug']}", 'candidate', c['name'],
                 'candidate_index' => i)
      end
      questions.each_with_index do |q, i|
        add_page(site, "questions/#{q['number']}", 'question', q['short'],
                 'question_index' => i, 'description' => q['text'])
      end
    end

    def add_page(site, dir, layout, title, data)
      page = Jekyll::PageWithoutAFile.new(site, site.source, dir, 'index.html')
      page.data.merge!(data, 'layout' => layout, 'title' => title)
      site.pages << page
    end
  end

  # Liquid filter that turns a plain-text form answer into HTML paragraphs,
  # escaping it and linking any URLs. Candidates separate paragraphs with
  # either one or two newlines, so every non-blank line is a paragraph.
  module AnswerFilter
    URL = %r{https?://[^\s<]+[^\s<.,;:!?)\]"']}

    def answer_html(text)
      text = text.to_s.strip
      return '<p class="no-answer">No answer provided.</p>' if text.empty?
      text.lines.map(&:strip).reject(&:empty?)
          .map { |para| "<p>#{paragraph(para)}</p>" }.join("\n")
    end

    private

    def paragraph(para)
      CGI.escapeHTML(para)
         .gsub(URL) { |url| %(<a href="#{url}" rel="noopener">#{url}</a>) }
    end
  end
end

Liquid::Template.register_filter(BikeloudSurvey::AnswerFilter)
