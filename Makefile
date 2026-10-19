IMAGE = bikeloud-candidate-survey:latest
XLSX ?= BIKELOUD_ City Council 2026 Candidate Questionnaire (Responses).xlsx

build-image:
	docker build -t $(IMAGE) --progress=plain .

serve: build-image
	docker run --rm -p 22031:22031 -p 35729:35729 -v ${PWD}:/app $(IMAGE)

build: build-image
	@docker run --rm -v ${PWD}:/app $(IMAGE) build

# Regenerate _data/questions.yml and _data/candidates.yml from the xlsx export.
import: build-image
	@docker run --rm -v ${PWD}:/app --entrypoint ruby $(IMAGE) \
	  bin/import-responses "$(XLSX)"

shell: build-image
	@docker run --rm -it -v ${PWD}:/app --entrypoint bash $(IMAGE)

.PHONY: build-image serve build import shell
