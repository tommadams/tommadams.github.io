---
layout: post
title:  Fast Poisson Disk Sampling
author: Tom Madams
gh_comment_id: 12
---

An implementation of [Fast Poisson Disk Sampling in Arbitrary Dimensions][paper]
by Robert Bridson.

The generated blue noise distribution is tileable.

{% raw %}

<style>
#canvas {
  border: 1px solid #000;
  border-radius: 4px;
  cursor: none;
}

input {
  width: 80px;
}

#demo {
  width: 512px;
  margin: 0 auto;
  text-align: right;
}

#clamp {
  color: #ccc;
  font-style: italic;
}

</style>

<div id="demo">
  <canvas id="canvas"></canvas>
  <p>spacing: <input id="spacing" type="text" value="32"/><br>
  <span id="clamp"></span></p>
  <p><a class="button" id="download">download JSON</a></p>
</div>

<script>
  class PoissonDiskSampler {
    constructor(size) {
      this.size = size;
      this.r = 0;
    }

    generateSamples(r) {
      this.r = Math.max(r, 4);
      this.cellSize = this.r / Math.sqrt(2);
      this.gridSize = Math.ceil(this.size / this.cellSize);
      this.samples = [];
      this.activeList = [];

      // Create the initial grid filled with -1, indicating no sample present.
      this.grid = new Int32Array(this.gridSize * this.gridSize);
      this.grid.fill(-1);

      // Initialize the active list
      let p = {
        x: Math.random() * this.size,
        y: Math.random() * this.size,
      };
      this.addPoint(p);

      while (this.activeList.length > 0) {
        let i = (Math.random() * this.activeList.length) | 0;
        let p = this.newValidSample(this.activeList[i]);
        if (p != null) {
          this.addPoint(p);
        } else {
          this.activeList.splice(i, 1);
        }
      }

      return this.samples;
    }

    addPoint(p) {
      let i = (p.x / this.cellSize) | 0;
      let j = (p.y / this.cellSize) | 0;
      let idx = i + j * this.gridSize;
      this.grid[idx] = this.samples.length;
      this.samples.push(p);
      this.activeList.push(p);
    }

    newCandidateSample(p) {
      for (let i = 0; i < 64; ++i) {
        // Generate a uniformly distributed sample point between radius r and 2*r
        // from p. Note that there are more efficient ways to do this but this
        // will do for simplicity.
        let dx, dy;
        while (true) {
          dx = (2 * Math.random() - 1) * 2 * this.r;
          dy = (2 * Math.random() - 1) * 2 * this.r;
          let dis = Math.sqrt(dx * dx + dy * dy);
          if (dis >= this.r && dis < 2 * this.r) {
            break;
          }
        }
        let x = p.x + dx;
        let y = p.y + dy;

        // Reject the sample point if it's not on the canvas.
        if (x < 0 || y < 0) { continue; }
        if (x >= this.size || y >= this.size) { continue; }
        return {x:x, y:y};
      }
      return null;
    }

    isValidSample(p) {
      if (p == null) { return false; }
      let pi = (p.x / this.cellSize) | 0;
      let pj = (p.y / this.cellSize) | 0;
      for (let j = pj - 2; j <= pj + 2; ++j) {
        let jj = (j + this.gridSize) % this.gridSize;
        for (let i = pi - 2; i <= pi + 2; ++i) {
          let ii = (i + this.gridSize) % this.gridSize;
          let g = this.grid[ii + jj * this.gridSize];
          if (g != -1) {
            if (this.wrappedDistance(this.samples[g], p) < this.r) {
              return false;
            }
          }
        }
      }
      return true;
    }

    newValidSample(p) {
      // Limit of samples of samples to choose before rejecting an active sample.
      const K = 64;
      for (let i = 0; i < K; ++i) {
        let q = this.newCandidateSample(p);
        if (this.isValidSample(q)) {
          return q;
        }
      }
      return null;
    }

    wrappedDistance(a, b) {
      let dx = a.x - b.x;
      if (dx < -0.5 * this.size) {
        dx += this.size;
      } else if (dx > 0.5 * this.size) {
        dx -= this.size;
      }
      let dy = a.y - b.y;
      if (dy < -0.5 * this.size) {
        dy += this.size;
      } else if (dy > 0.5 * this.size) {
        dy -= this.size;
      }
      return Math.sqrt(dx * dx + dy * dy);
    }
  }

  class Demo {
    constructor(ctx, size) {
      this.ctx = canvas.getContext('2d');
      this.size = size;
      this.sampler = new PoissonDiskSampler(size);
      canvas.addEventListener('mousemove', (e) => {
        let mousePos = {
          x: e.offsetX * pixelRatio,
          y: e.offsetY * pixelRatio,
        };
        window.requestAnimationFrame(() => { this.draw(mousePos); });
      });

      document.getElementById('spacing').addEventListener('input', () => {
        this.update();
      });

      document.getElementById('download').addEventListener('click', (e) => {
        let data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.sampler.samples));
        e.target.href = 'data:' + data;
        e.target.download = 'data.json';
      });
      this.update();
    }

    update() {
      let r = Number(document.getElementById('spacing').value);
      if (isNaN(r)) { return; }
      document.getElementById('clamp').innerText = r < 8 ? '(clamped to 8)' : '';
      r = Math.max(r, 8);
      if (r != this.r) {
        this.sampler.generateSamples(r);
        this.draw(null);
      }
    }

    /**
     * Draw filled circles with radius r.
     * @param ps list of circle centers.
     * @param style fill style.
     * @param r circle radius.
     */
    fillCircles(ps, style, r) {
      ps = this.tile(ps, r);

      let ctx = this.ctx;
      ctx.fillStyle = style;
      ctx.beginPath();
      for (let p of ps) {
        ctx.moveTo(p.x + r, p.y);
        ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      }
      ctx.fill();
    }

    /**
     * Draw stroked (unfilled) circles with radius r.
     * @param ps list of circle centers.
     * @param style stroke style.
     * @param r circle radius.
     */
    strokeCircles(ps, style, r) {
      ps = this.tile(ps, r);

      let ctx = this.ctx;
      ctx.strokeStyle = style;
      ctx.beginPath();
      for (let p of ps) {
        ctx.moveTo(p.x + r, p.y);
        ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }

    /**
     * Tile all circles in ps with radius r that intersect with the edge of the
     * canvas.
     * @param ps list of circle center points.
     * @param r radius of the circles.
     * @returns the tiled list of points.
     */
    tile(ps, r) {
      let result = [];
      for (let p of ps) {
        result.push(p);
        for (let j = -1; j <= 1; ++j) {
          let y = p.y + j * this.size;
          if (y + r < 0 || y - r >= this.size) { continue; }
          for (let i = -1; i <= 1; ++i) {
            let x = p.x + i * this.size;
            if (x + r < 0 || x - r >= this.size) { continue; }
            result.push({x: x, y: y});
          }
        }
      }
      return result;
    }

    draw(mousePos) {
      let ctx = this.ctx;
      ctx.fillStyle = '#272a2b'
      ctx.fillRect(0, 0, this.size, this.size);
      this.fillCircles(this.sampler.samples, '#aaa', 2 * pixelRatio);

      if (mousePos != null) {
        ctx.lineWidth = pixelRatio;
        this.strokeCircles([mousePos], '#0ff', this.sampler.r);
      }
    }
  }

  // Create the canvas and rendering context.
  let pixelRatio = (window.devicePixelRatio|0) || 1;
  let canvasSize = 512 * pixelRatio;
  let canvas = document.getElementById('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  canvas.style.width = `${canvasSize / pixelRatio}px`;
  canvas.style.height = `${canvasSize / pixelRatio}px`;

  new Demo(canvas, canvasSize);
</script>

{% endraw %}

[paper]: https://www.cct.lsu.edu/~fharhad/ganbatte/siggraph2007/CD2/content/sketches/0250.pdf
