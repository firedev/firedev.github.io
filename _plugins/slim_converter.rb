module Jekyll
  require 'slim'
  Slim::Engine.set_default_options :pretty => true

  class SlimConverter < Converter
    safe true
    priority :low

    def matches(ext)
      ext =~ /slim/i
    end

    def output_ext(ext)
      ".html"
    end

    def convert(content)
      puts "!!! Slim converting"
      begin
        engine = Tilt['slim'].new{content}
        engine.render
      rescue StandardError => e
        puts "!!! Slim Error: " + e.message
      end
    end
  end
end
